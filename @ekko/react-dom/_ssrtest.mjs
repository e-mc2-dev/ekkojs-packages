if (typeof globalThis.MessageChannel === "undefined") {
  globalThis.MessageChannel = class { constructor(){ const noop=()=>{}; const p=()=>({postMessage:noop,close:noop,onmessage:null,addEventListener:noop,removeEventListener:noop,start:noop}); this.port1=p(); this.port2=p(); } };
}
const { renderToString } = await import("react-dom/server.browser");
const React = await import("react");
const { createElement, useState, useContext, createContext } = React;
const Ctx = createContext("ctx-default");
function Child(){ const v = useContext(Ctx); const [n] = useState(7); return createElement("span", null, "n="+n+" ctx="+v); }
function App(){ return createElement(Ctx.Provider, { value: "hello" }, createElement("div", { className:"x" }, createElement(Child))); }
console.log("HOOK SSR OUTPUT:", renderToString(createElement(App)));
