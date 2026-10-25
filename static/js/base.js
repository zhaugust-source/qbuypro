
/* ================= 数据 ================= */
const PRODUCTS = JSON.parse(
    document.getElementById("goods-data").textContent
);
/* 错落陈列的固定节奏，按顺序循环取用 */
const LAYOUT = ['s3 r45', 's3 r34 off-1', 's2 r34', 's4 r43 off-2'];

/* ================= 工具 ================= */
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmt = n => "¥ " + n.toLocaleString("zh-CN");
const img = (seed,w,h) => `https://picsum.photos/seed/${seed}/${w}/${h}.jpg`;
const picFilter = "filter:saturate(.82) contrast(.96) brightness(1.04) sepia(.06);";

let cart = [];               // [{id, qty}]
let currentCat = "all";
let modalQty = 1;
let modalId = null;

/* ================= 滚动文字带 ================= */
(function(){
  const items = ["手 作 器 物","限 量 发 售","全 国 顺 丰 包 邮","七 日 无 理 由","工 坊 直 采","每 周 四 上 新"];
  const half = items.map(t=>`${t}<i></i>`).join("");
  $("#marqueeTrack").innerHTML = half + half;   // 两份内容拼接，实现无缝循环
})();
/* ================= 商品网格渲染 ================= */
function renderGrid(){
  const list = PRODUCTS.filter(p => currentCat==="all" || p.category===Number(currentCat));
  $("#grid").innerHTML = list.map((p,i)=>`
    <article class="product ${LAYOUT[i % LAYOUT.length]}"
             style="animation-delay:${i*0.07}s" data-id="${p.id}">
      <figure>
        <span class="qbuy-badge">限时换购</span>
        <img src="${p.img1}" alt="${p.name}" loading="lazy" style="${picFilter}">
        <button class="quick-add" data-add="${p.id}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12h14"/></svg>
          加入购物袋
        </button>
      </figure>
      <div class="p-meta"><h3>${p.name}</h3><span class="p-cat">${p.category_name}</span></div>
      <div class="p-foot">
        <div class="p-price">${fmt(p.price)}</div>
        <button class="qbuy-btn" data-qbuy="${p.id}" ${qbuyAttrs(p.id)}>${qbuyLabel(p.id)}</button>
      </div>
    </article>`).join("");
}

/* ================= 分类筛选 ================= */
function setFilter(cat){
  currentCat = cat;
  $$("#filters button").forEach(b=>b.classList.toggle("active", b.dataset.cat===cat));
  renderGrid();
}
$("#filters").addEventListener("click", e=>{
  const btn = e.target.closest("button[data-cat]");
  if(btn) setFilter(btn.dataset.cat);
});
// 导航与页脚的分类链接
$$("[data-cat]").forEach(a=>{
  if(a.id==="filters") return;
  a.addEventListener("click", ()=>{
    const cat = a.dataset.cat;
    if(document.getElementById("filters").querySelector(`[data-cat="${cat}"]`)) setFilter(cat);
  });
});

/* ================= Toast ================= */
let toastTimer;
function toast(msg){
  $("#toastMsg").textContent = msg;
  const t = $("#toast");
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove("show"), 2400);
}

/* ================= 购物车核心 ================= */
function findProduct(id){ return PRODUCTS.find(p=>p.id===Number(id)); }

function addToCart(id, qty){
  const item = cart.find(c=>c.id===Number(id));
  if(item) item.qty += qty;
  else cart.push({id:Number(id), qty});
  updateBag();
  toast("已放入购物袋");
}

function updateBag(){
  const count = cart.reduce((s,c)=>s+c.qty,0);
  const badge = $("#bagCount");
  badge.textContent = count;
  badge.classList.toggle("show", count>0);
  if(count>0){
    badge.classList.remove("pop"); void badge.offsetWidth; badge.classList.add("pop");
  }
  renderCart();
}

function renderCart(){
  const body = $("#drawerBody"), foot = $("#drawerFoot");
  if(cart.length===0){
    body.innerHTML = `
      <div class="cart-empty">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
        <p>购物袋还空着。<br>好的器物，值得慢慢挑选。</p>
        <button class="link-btn" id="keepBrowsing">继续选购</button>
      </div>`;
    foot.style.display = "none";
    body.querySelector("#keepBrowsing").onclick = ()=>{ closeDrawer(); document.getElementById("shop").scrollIntoView({behavior:"smooth"}); };
    return;
  }
  body.innerHTML = cart.map(c=>{
    const p = findProduct(c.id);
    return `
    <div class="cart-item">
      <figure><img src="${p.img1}" alt="${p.name}" style="${picFilter}"></figure>
      <div class="ci-info">
        <div class="ci-top">
          <h4>${p.name}</h4>
          <button class="ci-remove" data-remove="${p.id}" aria-label="移除">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 5l14 14M19 5L5 19"/></svg>
          </button>
        </div>
        <div class="ci-price">${fmt(p.price)}</div>
        <div class="stepper">
          <button data-dec="${p.id}" aria-label="减少">−</button>
          <b>${c.qty}</b>
          <button data-inc="${p.id}" aria-label="增加">+</button>
        </div>
      </div>
    </div>`;
  }).join("");
  const total = cart.reduce((s,c)=>s + findProduct(c.id).price * c.qty, 0);
  $("#cartTotal").textContent = fmt(total);
  foot.style.display = "block";
}

/* 抽屉内事件（委托） */
$("#drawer").addEventListener("click", e=>{
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  const rem = e.target.closest("[data-remove]");
  if(inc){ cart.find(c=>c.id===Number(inc.dataset.inc)).qty++; renderCart(); updateBadgeSilent(); }
  if(dec){
    const it = cart.find(c=>c.id===Number(dec.dataset.dec));
    it.qty--; if(it.qty<=0) cart = cart.filter(c=>c!==it);
    renderCart(); updateBadgeSilent();
  }
  if(rem){ cart = cart.filter(c=>c.id!==Number(rem.dataset.remove)); renderCart(); updateBadgeSilent(); }
});
function updateBadgeSilent(){
  const count = cart.reduce((s,c)=>s+c.qty,0);
  const badge = $("#bagCount");
  badge.textContent = count;
  badge.classList.toggle("show", count>0);
}

/* ================= 抽屉开合 ================= */
function openDrawer(){ $("#drawer").classList.add("open"); $("#overlay").classList.add("open"); document.body.style.overflow="hidden"; }
function closeDrawer(){ $("#drawer").classList.remove("open"); $("#overlay").classList.remove("open"); document.body.style.overflow=""; }
$("#bagBtn").addEventListener("click", openDrawer);
$("#drawerClose").addEventListener("click", closeDrawer);
$("#overlay").addEventListener("click", ()=>{ closeDrawer(); closeModal(); });

/* ================= 结算 ================= */
$("#checkoutBtn").addEventListener("click", ()=>{
  if(cart.length===0) return;
  const total = cart.reduce((s,c)=>s + findProduct(c.id).price * c.qty, 0);
  $("#drawerBody").innerHTML = `
    <div class="order-done">
      <div class="ring">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 12.5l5 5L20 6.5"/></svg>
      </div>
      <h4>订单已递交</h4>
      <p>合计 ${fmt(total)} · 共 ${cart.reduce((s,c)=>s+c.qty,0)} 件<br>我们会在 24 小时内安排发货，<br>感谢你愿意让手作之物进入日常。</p>
      <button class="link-btn" id="doneBtn">继续选购</button>
    </div>`;
  $("#drawerFoot").style.display = "none";
  cart = [];
  const badge = $("#bagCount");
  badge.textContent = "0"; badge.classList.remove("show");
  $("#doneBtn").onclick = ()=>{ closeDrawer(); setTimeout(renderCart, 500); };
});

/* ================= 限时抢购 ================= */
/* 后端约定：发起 qbuy_api → 201 排队中 / 100 未登录；
   轮询 query_qbuy_api → 200 成功 / 202 每日限一次 / 201 排队中 / 300 已抢完 */
const QCFG = document.getElementById("qbuyConfig");
const qbInitUrl = id => QCFG.dataset.initUrl.replace("/0/", `/${id}/`);
const qbPollUrl = id => QCFG.dataset.pollUrl.replace("/0/", `/${id}/`);
const qbToken   = () => QCFG.querySelector("[name=csrfmiddlewaretoken]").value;

const QB_POLL_MAX = 30;      // 轮询上限（任务端固定 sleep 10 秒，30 秒足够）
const QB_POLL_GAP = 1200;    // 轮询间隔 ms
const QB_LABEL = { won:"已抢到 ✓", dup:"今日已抢", out:"今日已空", busy:"排队抢购中…" };

const qbuyState = {};        // 商品 id -> won | dup | out
let qbuyBusyId = null;       // 正在排队抢购的商品，同一时刻只允许一个

function qbuyAttrs(id){
  const st = qbuyBusyId === Number(id) ? "busy" : (qbuyState[id] || "");
  return st ? `data-state="${st}" disabled` : "";
}
function qbuyLabel(id){
  if (qbuyBusyId === Number(id)) return QB_LABEL.busy;
  return QB_LABEL[qbuyState[id]] || "立即抢购";
}
function refreshQbuyUI(){
  $$(".qbuy-btn").forEach(btn=>{
    const id = Number(btn.dataset.qbuy);
    const st = qbuyBusyId === id ? "busy" : (qbuyState[id] || "");
    if (st) btn.dataset.state = st; else btn.removeAttribute("data-state");
    btn.disabled = !!st;
    btn.textContent = qbuyLabel(id);
  });
}

async function startQbuy(id){
  id = Number(id);
  if (!QCFG || qbuyState[id]) return;
  if (qbuyBusyId){ toast("已有抢购正在进行，请稍候"); return; }
  qbuyBusyId = id;
  refreshQbuyUI();
  try{
    const res  = await fetch(qbInitUrl(id), {
      method:"POST",
      headers:{ "X-CSRFToken": qbToken() }
    });
    const d = await res.json();
    if (d.code === 201){ pollQbuy(id, 0); return; }
    qbuyBusyId = null;
    if (d.code === 100) toast("请先登录后再参与抢购");
    else toast(d.msg || "抢购请求失败，请稍后再试");
    refreshQbuyUI();
  }catch(err){
    qbuyBusyId = null;
    toast("网络异常，请稍后再试");
    refreshQbuyUI();
  }
}

function pollQbuy(id, tries){
  if (tries >= QB_POLL_MAX){
    qbuyBusyId = null;
    refreshQbuyUI();
    toast("排队超时，请稍后刷新查看结果");
    return;
  }
  setTimeout(async ()=>{
    if (qbuyBusyId !== id) return;   // 已被重置
    try{
      const res = await fetch(qbPollUrl(id));
      const d   = await res.json();
      if (d.code === 201){ pollQbuy(id, tries + 1); return; }
      finishQbuy(id, d);
    }catch(err){ pollQbuy(id, tries + 1); }
  }, QB_POLL_GAP);
}

function finishQbuy(id, d){
  qbuyBusyId = null;
  const p = findProduct(id);
  if (d.code === 200){ qbuyState[id] = "won"; toast(`抢购成功，「${p ? p.name : "器物"}」已为你锁定`); }
  else if (d.code === 202){ qbuyState[id] = "dup"; toast("今日已参与过抢购，每人每天限一次"); }
  else if (d.code === 300){ qbuyState[id] = "out"; toast("手慢了，今日名额已被抢完"); }
  else toast(d.msg || "抢购失败，请稍后再试");
  refreshQbuyUI();
}

/* 刷新页面后回填各商品的抢购状态 */
async function restoreQbuyState(){
  PRODUCTS.forEach(async p=>{
    try{
      const res = await fetch(qbPollUrl(p.id));
      const d   = await res.json();
      if (d.code === 200 || d.code === 202 || d.code === 300){
        qbuyState[p.id] = { 200:"won", 202:"dup", 300:"out" }[d.code];
        refreshQbuyUI();
      }
    }catch(err){ /* 静默失败，按钮保持可抢 */ }
  });
}

/* ================= 快速预览模态 ================= */
function openModal(id){
  const p = findProduct(id);
  modalId = Number(id); modalQty = 1;
  $("#modal").innerHTML = `
    <figure><img src="${p.img1}" alt="${p.name}" style="${picFilter}"></figure>
    <div class="modal-info">
      <button class="icon-btn m-close" id="mClose" aria-label="关闭">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 5l14 14M19 5L5 19"/></svg>
      </button>
      <div class="m-cat">${p.category_name} · HANDMADE</div>
      <h3>${p.name}</h3>
      <div class="m-price">${fmt(p.price)}</div>
      <p class="m-desc">${p.info}</p>
      <div class="m-row">
        <div class="stepper">
          <button id="mDec" aria-label="减少">−</button><b id="mQty">1</b><button id="mInc" aria-label="增加">+</button>
        </div>
        <button class="qbuy-btn m-qbuy" id="mQbuy" data-qbuy="${modalId}" ${qbuyAttrs(modalId)}>${qbuyLabel(modalId)}</button>
        <button class="m-add" id="mAdd">放入购物袋</button>
      </div>
    </div>`;
  $("#modalWrap").classList.add("open");
  $("#overlay").classList.add("open");
  document.body.style.overflow = "hidden";

  $("#mClose").onclick = closeModal;
  $("#mInc").onclick = ()=>{ modalQty++; $("#mQty").textContent = modalQty; };
  $("#mDec").onclick = ()=>{ if(modalQty>1){ modalQty--; $("#mQty").textContent = modalQty; } };
  $("#mAdd").onclick = ()=>{ addToCart(modalId, modalQty); closeModal(); };
  $("#mQbuy").onclick = ()=>{ if($("#mQbuy").disabled) return; closeModal(); startQbuy(modalId); };
}
function closeModal(){
  $("#modalWrap").classList.remove("open");
  if(!$("#drawer").classList.contains("open")){ $("#overlay").classList.remove("open"); document.body.style.overflow=""; }
}
$("#modalWrap").addEventListener("click", e=>{ if(e.target.id==="modalWrap") closeModal(); });
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ closeModal(); closeDrawer(); } });

/* 商品区事件（委托）：点抢购 = 发起抢购；点加购 = 直接加购；点卡片其余区域 = 预览 */
$("#grid").addEventListener("click", e=>{
  const qbuy  = e.target.closest("[data-qbuy]");
  const quick = e.target.closest("[data-add]");
  const card  = e.target.closest(".product");
  if(qbuy){ e.stopPropagation(); startQbuy(qbuy.dataset.qbuy); return; }
  if(quick){ e.stopPropagation(); addToCart(quick.dataset.add, 1); return; }
  if(card) openModal(card.dataset.id);
});

/* ================= 滚动相关 ================= */
const nav = $("#nav");
window.addEventListener("scroll", ()=>{
  nav.classList.toggle("scrolled", window.scrollY > 40);
}, {passive:true});

/* 滚动显现 */
const io = new IntersectionObserver(entries=>{
  entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
},{threshold:.12});
$$(".reveal").forEach(el=>io.observe(el));

/* ================= 初始化 ================= */
$("#year").textContent = new Date().getFullYear();
renderGrid();
updateBag();
renderCart();
restoreQbuyState();
