import { collections } from './data/collections.js';

// Application behavior stays separate from collection data and page styles.
const year = document.querySelector('#footer-year');
if (year) year.textContent = String(new Date().getFullYear());

// Keep the first collection registered while its catalog and tracker are built.
const [firstCollection] = collections;
document.documentElement.dataset.firstCollection = firstCollection.id;
