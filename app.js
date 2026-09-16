/* ===== GLAM TOUCH — app.js ===== */

let DATA = null;          // loaded from data.json
let currentFilter = 'all';
let currentSearch  = '';

/* ---------- INIT ---------- */
async function init() {
  try {
    const res = await fetch('data.json');
    DATA = await res.json();
  } catch (e) {
    console.error('Could not load data.json:', e);
    document.body.innerHTML =
      '<div style="padding:4rem 1.5rem;text-align:center;font-family:sans-serif;color:#5F5E5A">' +
      '⚠️ Sorry, the store could not be loaded right now. Please refresh the page or try again later.</div>';
    return;
  }
  buildNav();
  buildHomePage();
  buildProductsPage();
  buildBlogPage();
  buildAboutPage();
  buildContactPage();
  buildFooter();
  renderHomeProducts();
  showPage('home');
}

/* ---------- NAV ---------- */
function buildNav() {
  // Nav is already in the HTML; nothing to build dynamically.
}

function setActive(el) {
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
}

function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

/* ---------- PAGES ---------- */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  window.scrollTo(0, 0);
  if (name === 'home')     renderHomeProducts();
  if (name === 'products') renderAllProducts();
  if (name === 'blog')     renderBlog();
}

function showPageFiltered(cat) {
  currentFilter = cat;
  showPage('products');
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('active');
    if (b.getAttribute('data-cat') === cat) b.classList.add('active');
  });
}

/* ---------- HELPERS ---------- */
// Every product now carries its own ready-to-use affiliate "link" field
// (a full Amazon/other affiliate URL), instead of an ASIN the code had to
// assemble a link from. Falls back gracefully if a link is ever missing.
function getAffiliateLink(p) {
  if (p.link) return p.link;
  console.warn(`Product #${p.id} ("${p.name}") has no affiliate link set.`);
  return '#';
}

const BADGE_LABELS = { popular: '⭐ Best Seller', new: '✨ New', sale: '🔥 On Sale' };

function badgeHtml(p) {
  return p.badge && BADGE_LABELS[p.badge]
    ? `<span class="product-badge badge-${p.badge}">${BADGE_LABELS[p.badge]}</span>`
    : '';
}

function productCard(p, clickable = true) {
  const clickAttr = clickable ? `onclick="openDetail(${p.id})"` : '';
  const oldPrice  = p.oldPrice ? `<span class="old">$${p.oldPrice}</span>` : '';
  return `
  <div class="product-card" ${clickAttr}>
   <div class="product-img">
  ${p.image 
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">` 
    : (p.emoji || '🛍️')}
</div>
    <div class="product-body">
      ${badgeHtml(p)}
      <div class="product-name">${p.name}</div>
      <div class="product-desc">${p.desc}</div>
      <div class="product-footer">
        <div class="product-price">${oldPrice} $${p.price}</div>
        <a class="buy-btn"
           href="${getAffiliateLink(p)}"
           target="_blank"
           rel="nofollow sponsored noopener"
           onclick="event.stopPropagation(); showToast('Opening Amazon... 🛒')">
          Buy Now
        </a>
      </div>
    </div>
  </div>`;
}

/* ---------- HOME PAGE ---------- */
function buildHomePage() {
  // Stats
  const statsEl = document.getElementById('stats-inner');
  if (statsEl) {
    statsEl.innerHTML = DATA.stats.map(s => `
      <div class="stat-item">
        <div class="stat-num">${s.num}</div>
        <div class="stat-label">${s.label}</div>
      </div>`).join('');
  }

  // Categories
  // Product counts are computed live from DATA.products (rather than a
  // hardcoded "count" string) so the number shown always matches reality.
  const catsEl = document.getElementById('cats-grid');
  if (catsEl) {
    catsEl.innerHTML = DATA.categories.map(c => {
      const count = DATA.products.filter(p => p.cat === c.key).length;
      return `
      <a class="cat-card" href="#" onclick="showPageFiltered('${c.key}'); return false;">
        <div class="cat-emoji">${c.emoji}</div>
        <div class="cat-name">${c.name}</div>
        <div class="cat-count">${count} product${count === 1 ? '' : 's'}</div>
      </a>`;
    }).join('');
  }
}

function renderHomeProducts() {
  if (!DATA) return;
  const popular = DATA.products.filter(p => p.badge === 'popular').slice(0, 4);
  const el = document.getElementById('home-products');
  if (el) el.innerHTML = popular.map(p => productCard(p)).join('');
}

/* ---------- PRODUCTS PAGE ---------- */
function buildProductsPage() {
  const filterBar = document.getElementById('filterBar');
  if (!filterBar || !DATA) return;

  const allBtn = `<button class="filter-btn active" data-cat="all" onclick="filterCat('all', this)">All</button>`;
  const catBtns = DATA.categories.map(c =>
    `<button class="filter-btn" data-cat="${c.key}" onclick="filterCat('${c.key}', this)">${c.emoji} ${c.name}</button>`
  ).join('');
  filterBar.innerHTML = allBtn + catBtns;
}

function filterCat(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAllProducts();
}

function filterProducts() {
  currentSearch = document.getElementById('searchInput').value.toLowerCase();
  renderAllProducts();
}

function renderAllProducts() {
  if (!DATA) return;
  let filtered = DATA.products;
  if (currentFilter !== 'all') filtered = filtered.filter(p => p.cat === currentFilter);
  if (currentSearch) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(currentSearch) ||
    p.desc.toLowerCase().includes(currentSearch)
  );
  const el = document.getElementById('all-products');
  if (!el) return;
  el.innerHTML = filtered.length
    ? filtered.map(p => productCard(p)).join('')
    : '<p style="color:var(--text3);grid-column:1/-1;text-align:center;padding:2rem">No products match your search.</p>';
}

/* ---------- BLOG PAGE ---------- */
function buildBlogPage() { /* rendered on demand */ }

function renderBlog() {
  if (!DATA) return;
  const el = document.getElementById('blog-grid');
  if (!el) return;
  el.innerHTML = DATA.blogs.map(b => `
    <div class="blog-card" onclick="openBlog(${b.id})">
      <div class="blog-img" style="background:var(--gold-light)">${b.emoji}</div>
      <div class="blog-body">
        <span class="blog-tag">${b.tag}</span>
        <div class="blog-title">${b.title}</div>
        <div class="blog-excerpt">${b.excerpt}</div>
        <div class="blog-meta">
          <span>📅 ${b.date}</span>
          <span>⏱ ${b.read}</span>
        </div>
      </div>
    </div>`).join('');
}

/* ---------- DETAIL PAGES ---------- */
function openDetail(id) {
  const p = DATA.products.find(x => x.id === id);
  const content = document.getElementById('detail-content');
  if (!p) {
    content.style.gridTemplateColumns = '1fr';
    content.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem 0">
        <button class="back-btn" onclick="showPage('products')">← Back to Products</button>
        <p style="color:var(--text2);margin-top:1rem">Sorry, we couldn't find that product.</p>
      </div>`;
    showPage('detail');
    return;
  }

  // specs are optional — only render the list if the product actually has any
  const specs = (p.specs && p.specs.length)
    ? `<ul class="specs-list">${p.specs.map(s => `<li><span>${s[0]}</span><span>${s[1]}</span></li>`).join('')}</ul>`
    : '';
  const oldPrice = p.oldPrice ? `<span class="old">$${p.oldPrice}</span>` : '';

  content.style.gridTemplateColumns = '';
  content.innerHTML = `
    <div>
      <button class="back-btn" onclick="showPage('products')">← Back to Products</button>
     <div class="detail-img-main">
  ${p.image 
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius);">` 
    : (p.emoji || '🛍️')}
</div>
      <div class="detail-thumbs">
        <div class="detail-thumb active">${p.emoji || '🛍️'}</div>
        <div class="detail-thumb">📦</div>
        <div class="detail-thumb">✨</div>
      </div>
    </div>
    <div>
      ${p.badge && BADGE_LABELS[p.badge] ? `<span class="product-badge badge-${p.badge}" style="margin-bottom:12px;display:inline-block">${BADGE_LABELS[p.badge]}</span>` : ''}
      <h1 class="detail-info">${p.name}</h1>
      <div class="detail-rating"><span class="stars">★★★★★</span><span>4.8 out of 5 (234 reviews)</span></div>
      <div class="detail-price">${oldPrice} $${p.price}</div>
      <div class="detail-desc">${p.desc}. Carefully curated from Amazon with the highest quality standards and best customer ratings.</div>
      ${specs}
      <a href="${getAffiliateLink(p)}" target="_blank"
         rel="nofollow sponsored noopener"
         class="buy-btn detail-btn"
         onclick="showToast('Opening Amazon... 🛒')">
        🛒 Buy Now on Amazon
      </a>
    </div>`;
  showPage('detail');
}

function openBlog(id) {
  const b = DATA.blogs.find(x => x.id === id);
  const content = document.getElementById('detail-content');
  if (!b) {
    content.style.gridTemplateColumns = '1fr';
    content.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem 0">
        <button class="back-btn" onclick="showPage('blog')">← Back to Blog</button>
        <p style="color:var(--text2);margin-top:1rem">Sorry, we couldn't find that article.</p>
      </div>`;
    showPage('detail');
    return;
  }
  const relatedProds = DATA.products.filter(p => p.cat === b.catKey).slice(0, 2);

  content.style.gridTemplateColumns = '1fr';
  content.innerHTML = `
    <div style="max-width:700px;margin:0 auto;padding:2rem 0;grid-column:1/-1">
      <button class="back-btn" onclick="showPage('blog')">← Back to Blog</button>
      <div style="font-size:5rem;text-align:center;margin:1rem 0">${b.emoji}</div>
      <span class="blog-tag">${b.tag}</span>
      <h1 style="font-size:1.8rem;font-weight:700;margin:1rem 0;line-height:1.4">${b.title}</h1>
      <div class="blog-meta" style="margin-bottom:1.5rem">
        <span>📅 ${b.date}</span><span>⏱ ${b.read}</span>
      </div>
      <p style="font-size:15px;color:var(--text2);line-height:1.9;margin-bottom:1.5rem">${b.excerpt}</p>
      <p style="font-size:15px;color:var(--text2);line-height:1.9;margin-bottom:1.5rem">
        At Glam Touch, we go beyond just listing products — we test, research, and handpick only what genuinely works.
        Whether you're a beauty beginner or a total pro, our tips are designed to help you get the most out of every product.
      </p>
      <p style="font-size:15px;color:var(--text2);line-height:1.9">
        Follow us for more beauty tips and don't forget to share this article with a friend!
      </p>
      ${relatedProds.length ? `
        <h3 style="font-size:1.1rem;font-weight:600;margin:2rem 0 1rem;color:var(--text)">Related Products</h3>
        <div class="products-grid">${relatedProds.map(p => productCard(p, true)).join('')}</div>` : ''}
    </div>`;
  showPage('detail');
}

/* ---------- ABOUT & CONTACT (static, no JS needed) ---------- */
function buildAboutPage()   { /* static HTML */ }
function buildContactPage() { /* static HTML */ }

/* ---------- FOOTER ---------- */
function buildFooter() {
  const catLinks = document.getElementById('footer-cat-links');
  if (catLinks && DATA) {
    catLinks.innerHTML = DATA.categories.map(c =>
      `<a href="#" onclick="showPageFiltered('${c.key}'); return false;">${c.name}</a>`
    ).join('');
  }
}

/* ---------- FORM ---------- */
function submitForm(e) {
  e.preventDefault();
  document.getElementById('formSuccess').classList.add('show');
  e.target.reset();
  setTimeout(() => document.getElementById('formSuccess').classList.remove('show'), 5000);
}

/* ---------- NEWSLETTER ---------- */
function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail').value;
  if (email) {
    showToast('Subscribed! Thank you 💌');
    document.getElementById('newsletterEmail').value = '';
  }
}

/* ---------- TOAST ---------- */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ---------- START ---------- */
document.addEventListener('DOMContentLoaded', init);
