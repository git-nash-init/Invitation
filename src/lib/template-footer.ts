import { BRAND, SITE_URL } from "@/lib/brand";

/**
 * Every live invitation ends with the same small credit: our mark, the motto and a link home.
 *
 * It is added here, as the page is served, rather than copied into each template. That way every
 * template gets it, the ones that exist now and any added later, and a host cannot edit it away.
 *
 * It shows only on the link a guest opens (the page carries a `#platform=` payload and is not in the
 * editor), so the editor, the stand-alone demo and the preview recordings stay clean.
 */
function footerScript(): string {
  const cfg = {
    name: BRAND.name,
    motto: BRAND.motto,
    cta: "Make yours free",
    href: `${SITE_URL.replace(/\/$/, "")}/?utm_source=invitation&utm_medium=footer`,
    mark: "/brand/mark.svg",
  };

  // Plain ES5 on purpose: it runs inside every template, whatever else is on the page.
  return `<script data-pratham-credit>(function(){
var C=${JSON.stringify(cfg)};
try{
if(!/[#&]platform=/.test(location.hash)||/[?&]edit=1(&|$)/.test(location.search))return;
function build(){
if(document.getElementById('pratham-credit'))return;
var st=document.createElement('style');
st.textContent=
'#pratham-credit{position:relative;z-index:5;clear:both;display:block;width:100%;box-sizing:border-box;margin:0;padding:34px 20px calc(30px + env(safe-area-inset-bottom,0px));text-align:center;background:linear-gradient(180deg,#5a0f27,#2e0713);color:#fff4e2;font-family:"DM Sans",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;border-top:1px solid rgba(255,214,107,.45)}'+
'#pratham-credit *{box-sizing:border-box}'+
'#pratham-credit .pc-mark{display:block;width:34px;height:auto;margin:0 auto 10px}'+
'#pratham-credit .pc-name{display:block;margin:0;font-family:"Cormorant Garamond",Georgia,"Times New Roman",serif;font-size:24px;line-height:1.1;font-weight:600;letter-spacing:.01em;color:#ffd66b}'+
'#pratham-credit .pc-motto{display:block;margin:6px auto 0;max-width:22rem;font-size:14px;line-height:1.5;color:rgba(255,244,226,.82)}'+
'#pratham-credit .pc-link{display:inline-flex;align-items:center;justify-content:center;min-height:44px;margin-top:16px;padding:0 22px;border-radius:999px;background:linear-gradient(180deg,#ffd66b,#f5a300);color:#3b0a1a;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:.01em}'+
'#pratham-credit .pc-link:focus-visible{outline:2px solid #fff4e2;outline-offset:3px}';
document.head.appendChild(st);
var f=document.createElement('footer');
f.id='pratham-credit';
f.setAttribute('role','contentinfo');
var img=document.createElement('img');
img.className='pc-mark';img.src=C.mark;img.alt='';img.width=34;img.height=41;
var n=document.createElement('span');n.className='pc-name';n.textContent=C.name;
var m=document.createElement('span');m.className='pc-motto';m.textContent=C.motto;
var a=document.createElement('a');a.className='pc-link';a.href=C.href;a.target='_blank';a.rel='noopener';a.textContent=C.cta;
a.setAttribute('aria-label',C.cta+' with '+C.name);
f.appendChild(img);f.appendChild(n);f.appendChild(m);f.appendChild(a);
document.body.appendChild(f);
try{window.dispatchEvent(new Event('resize'));}catch(e){}
}
if(document.readyState==='complete')setTimeout(build,0);else window.addEventListener('load',function(){setTimeout(build,0);});
}catch(e){}
})();</script>`;
}

/**
 * Adds the shared page additions to a template's index.html, just before the page closes: the text
 * size and alignment bar (_platform/text-format.js, every page) and the credit (live pages only).
 */
export function withBrandFooter(html: string): string {
  const tag = '<script src="../_platform/text-format.js"></script>' + footerScript();
  const at = html.lastIndexOf("</body>");
  return at === -1 ? html + tag : html.slice(0, at) + tag + html.slice(at);
}
