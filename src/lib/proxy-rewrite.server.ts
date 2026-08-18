/**
 * HTML / CSS rewriting for the server-side URL proxy.
 * Every discovered URL is resolved against the document base and pointed
 * back at our own /api/public/proxy endpoint.
 */

import { toProxyPath } from "./proxy-url";

export function resolveAndProxy(raw: string, base: string): string {
  const value = raw.trim();
  if (!value) return raw;
  if (/^(data:|blob:|javascript:|mailto:|tel:|about:|#)/i.test(value)) return value;
  try {
    const abs = new URL(value, base).toString();
    if (!/^https?:/i.test(abs)) return value;
    return toProxyPath(abs);
  } catch {
    return value;
  }
}

function rewriteSrcset(value: string, base: string): string {
  return value
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      const [url, ...descriptors] = trimmed.split(/\s+/);
      return [resolveAndProxy(url ?? "", base), ...descriptors].join(" ");
    })
    .filter(Boolean)
    .join(", ");
}

export function rewriteCss(css: string, base: string): string {
  return css
    .replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (_m, quote: string, url: string) => {
      return `url(${quote}${resolveAndProxy(url, base)}${quote})`;
    })
    .replace(/@import\s+(['"])([^'"]+)\1/gi, (_m, quote: string, url: string) => {
      return `@import ${quote}${resolveAndProxy(url, base)}${quote}`;
    });
}

const URL_ATTRS = [
  "href",
  "src",
  "action",
  "poster",
  "data-src",
  "formaction",
  "background",
];

/** Runtime shim injected into every proxied document. */
function clientShim(base: string): string {
  return `<script data-proxy-shim>(function(){
  var BASE=${JSON.stringify(base)};
  var P=${JSON.stringify("/api/public/proxy")};
  function abs(u){try{return new URL(u,BASE).toString()}catch(e){return null}}
  function wrap(u){
    if(typeof u!=="string")return u;
    if(u.indexOf(P)===0)return u;
    if(/^(data:|blob:|javascript:|mailto:|tel:|about:|#)/i.test(u))return u;
    var a=abs(u); if(!a||!/^https?:/i.test(a))return u;
    return P+"?url="+encodeURIComponent(a);
  }
  var of=window.fetch;
  window.fetch=function(input,init){
    try{
      if(typeof input==="string")input=wrap(input);
      else if(input&&input.url)input=new Request(wrap(input.url),input);
    }catch(e){}
    return of.call(this,input,init);
  };
  var oo=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(m,u){
    try{u=wrap(u)}catch(e){}
    return oo.apply(this,[m,u].concat([].slice.call(arguments,2)));
  };
  var ow=window.open;
  window.open=function(u){try{u=wrap(u)}catch(e){}
    return ow.apply(window,[u].concat([].slice.call(arguments,1)));};
  document.addEventListener("click",function(e){
    var a=e.target&&e.target.closest?e.target.closest("a[href]"):null;
    if(!a)return;
    var h=a.getAttribute("href")||"";
    if(h.indexOf(P)===0)return;
    var w=wrap(h);
    if(w!==h){a.setAttribute("href",w);}
  },true);
  function notify(){
    try{parent.postMessage({__proxy:"location",url:BASE,title:document.title},"*")}catch(e){}
  }
  if(document.readyState!=="loading")notify();
  else document.addEventListener("DOMContentLoaded",notify);
})();</script>`;
}

export function rewriteHtml(html: string, base: string): string {
  let out = html;

  // Drop <base> tags — we resolve everything ourselves.
  out = out.replace(/<base\b[^>]*>/gi, "");

  // Strip CSP / frame-busting meta tags.
  out = out.replace(
    /<meta[^>]+http-equiv=["']?(content-security-policy|x-frame-options)["']?[^>]*>/gi,
    "",
  );

  // Remove SRI hashes (content changes after rewriting).
  out = out.replace(/\s(integrity|nonce)=(["'])[^"']*\2/gi, "");

  // <style> blocks
  out = out.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_m, attrs: string, css: string) => {
    return `<style${attrs}>${rewriteCss(css, base)}</style>`;
  });

  // style="" attributes
  out = out.replace(/\sstyle=(["'])([\s\S]*?)\1/gi, (_m, q: string, css: string) => {
    return ` style=${q}${rewriteCss(css, base)}${q}`;
  });

  // srcset / imagesrcset
  out = out.replace(
    /\s(srcset|imagesrcset)=(["'])([\s\S]*?)\2/gi,
    (_m, attr: string, q: string, val: string) => ` ${attr}=${q}${rewriteSrcset(val, base)}${q}`,
  );

  // Plain URL attributes
  const attrPattern = new RegExp(`\\s(${URL_ATTRS.join("|")})=(["'])([^"']*)\\2`, "gi");
  out = out.replace(attrPattern, (_m, attr: string, q: string, val: string) => {
    return ` ${attr}=${q}${resolveAndProxy(val, base)}${q}`;
  });

  const shim = clientShim(base);
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head([^>]*)>/i, (m) => `${m}${shim}`);
  } else {
    out = shim + out;
  }
  return out;
}
