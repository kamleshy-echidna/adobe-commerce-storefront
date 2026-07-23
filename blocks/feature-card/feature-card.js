import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  block.innerHTML = `
    <div class="feature-cards">

      <article class="feature-card">

          <figure class="feature-card__image">

              <img>

          </figure>

          <div class="feature-card__content">

              <h3 class="feature-card__title">

              </h3>

              <p class="feature-card__description">

              </p>

              <a class="feature-card__button">

              </a>

          </div>

      /article>

    </div>
  `;
}
