# Public helper code only. The companion sends requests and keys through stdin.
# Generic credentials are local to this Windows user's computer (Persist = 2).
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
try {
    $inputText = [Console]::In.ReadToEnd()
    if ($inputText.Length -gt 4096) { throw 'Invalid request' }
    $request = ConvertFrom-Json -InputObject $inputText
    if ($request.operation -notin @('status', 'save', 'load', 'forget') -or
        $request.provider -notin @('openai', 'claude', 'deepseek') -or
        $request.service -notmatch '^[a-zA-Z0-9._-]{1,120}$') { throw 'Invalid request' }
    if ($request.operation -eq 'save' -and $request.key -cnotmatch '^[\x21-\x7e]{6,1000}$') { throw 'Invalid key' }
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class AtlasCredentialStore {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct Credential {
        public uint Flags;
        public uint Type;
        [MarshalAs(UnmanagedType.LPWStr)] public string TargetName;
        [MarshalAs(UnmanagedType.LPWStr)] public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public uint CredentialBlobSize;
        public IntPtr CredentialBlob;
        public uint Persist;
        public uint AttributeCount;
        public IntPtr Attributes;
        [MarshalAs(UnmanagedType.LPWStr)] public string TargetAlias;
        [MarshalAs(UnmanagedType.LPWStr)] public string UserName;
    }
    [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool Read(string target, uint type, uint flags, out IntPtr value);
    [DllImport("Advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool Write(ref Credential value, uint flags);
    [DllImport("Advapi32.dll", EntryPoint = "CredDeleteW", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool Delete(string target, uint type, uint flags);
    [DllImport("Advapi32.dll", EntryPoint = "CredFree")]
    private static extern void Free(IntPtr value);
    private static IntPtr Find(string target) {
        IntPtr value;
        if (Read(target, 1, 0, out value)) return value;
        if (Marshal.GetLastWin32Error() == 1168) return IntPtr.Zero;
        throw new InvalidOperationException("Credential store unavailable");
    }
    public static bool Status(string target) {
        IntPtr value = Find(target);
        if (value == IntPtr.Zero) return false;
        Free(value); return true;
    }
    public static string Load(string target) {
        IntPtr value = Find(target);
        if (value == IntPtr.Zero) return null;
        byte[] bytes = null;
        try {
            Credential credential = (Credential)Marshal.PtrToStructure(value, typeof(Credential));
            if (credential.Type != 1 || credential.CredentialBlobSize < 6 || credential.CredentialBlobSize > 1000 || credential.CredentialBlob == IntPtr.Zero)
                throw new InvalidOperationException("Invalid saved credential");
            bytes = new byte[credential.CredentialBlobSize];
            Marshal.Copy(credential.CredentialBlob, bytes, 0, bytes.Length);
            return new UTF8Encoding(false, true).GetString(bytes);
        } finally {
            if (bytes != null) Array.Clear(bytes, 0, bytes.Length);
            Free(value);
        }
    }
    public static void Save(string target, string provider, string key) {
        byte[] bytes = Encoding.UTF8.GetBytes(key);
        IntPtr blob = Marshal.AllocHGlobal(bytes.Length);
        try {
            Marshal.Copy(bytes, 0, blob, bytes.Length);
            Credential value = new Credential();
            value.Type = 1;
            value.TargetName = target;
            value.Comment = "Atlas Study World API key";
            value.UserName = provider;
            value.CredentialBlobSize = (uint)bytes.Length;
            value.CredentialBlob = blob;
            value.Persist = 2;
            if (!Write(ref value, 0)) throw new InvalidOperationException("Credential store unavailable");
        } finally {
            Array.Clear(bytes, 0, bytes.Length);
            Marshal.Copy(bytes, 0, blob, bytes.Length);
            Marshal.FreeHGlobal(blob);
        }
    }
    public static void Forget(string target) {
        if (!Delete(target, 1, 0) && Marshal.GetLastWin32Error() != 1168)
            throw new InvalidOperationException("Credential store unavailable");
    }
}
'@ | Out-Null
    $target = $request.service + '/' + $request.provider
    switch ($request.operation) {
        'status' { $answer = @{ ok = $true; saved = [AtlasCredentialStore]::Status($target) } }
        'load' { $answer = @{ ok = $true; key = [AtlasCredentialStore]::Load($target) } }
        'save' { [AtlasCredentialStore]::Save($target, $request.provider, $request.key); $answer = @{ ok = $true } }
        'forget' { [AtlasCredentialStore]::Forget($target); $answer = @{ ok = $true } }
    }
    [Console]::Out.Write((ConvertTo-Json -InputObject $answer -Compress))
    exit 0
} catch {
    # Never echo exceptions or request contents: either can contain sensitive data.
    [Console]::Out.Write('{"ok":false}')
    exit 1
}
