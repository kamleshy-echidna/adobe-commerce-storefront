import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  block.innerHTML = `
    <div style="padding:20px;border:2px solid red">
      <h2>Feature Card Working</h2>
      <p>My first custom block.</p>
    </div>
  `;
}
