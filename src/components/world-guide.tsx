import {thresholds} from '@/lib/study';

export default function WorldGuide(){
 return <section className="panel world-guide" aria-labelledby="world-guide-title">
  <h2 id="world-guide-title">Your effort, made visible</h2>
  <p>Each island represents a subject you study. Your world reflects the time you invest and the achievements you earn, giving you a visual record of your progress.</p>
  <details>
   <summary>How your world grows</summary>
   <div className="world-guide-content">
    <p><strong>Study levels.</strong> Start at Level 1. Logged study time raises your level at {thresholds.slice(1).join(', ')} total hours, reaching Level {thresholds.length}. Levels measure time invested; they do not assess mastery.</p>
    <p><strong>Achievement scenery.</strong> Earned achievements add small trees and a taller glowing tower to that subject’s island. Scenery reflects up to 12 achievements; you can keep earning rewards after that. The island’s land area stays the same size.</p>
    <p><strong>Your chosen reward.</strong> Open Collection and select “Display on island” on an earned reward to add a glowing ornament. You can display one reward per subject and change it whenever you like.</p>
    <p><strong>Explore at your pace.</strong> Drag to explore, select an island for a close-up, and choose “Whole world” to return to the overview. Calm mode turns off automatic movement.</p>
   </div>
  </details>
 </section>;
}
