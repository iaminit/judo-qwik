import{_ as a}from"./q-DoNi8vyY.js";import{p as d,q as i,y as b,C as l,i as n,k as m,F as g,u as p,_hW as f}from"./q-GWx3MS6J.js";import{g as _}from"./q-D-1uqPQX.js";const h=`
    @import 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
    
    .ql-editor { 
      padding: 0 !important; 
      color: inherit !important;
      font-size: 1.125rem !important;
      line-height: 1.75 !important;
    }
    
    .ql-editor * {
      color: inherit; 
    }

    .dark .ql-editor { 
      color: #f3f4f6 !important; 
    }

    .ql-container.ql-snow { 
      border: none !important; 
      font-family: inherit !important; 
      height: auto !important;
    }
    
    /* Ensure inline styles for colors always win over Tailwind prose */
    .ql-editor span[style] {
      color: attr(style);
    }
    
    /* Fallback for Quill classes if inline styles fail */
    .ql-color-red { color: #ef4444 !important; }
    .ql-color-green { color: #22c55e !important; }
    .ql-color-blue { color: #3b82f6 !important; }
    .ql-color-orange { color: #f97316 !important; }
    .ql-color-yellow { color: #eab308 !important; }
    .ql-color-purple { color: #a855f7 !important; }
    .ql-bg-red { background-color: #fee2e2 !important; }
    .ql-bg-green { background-color: #dcfce7 !important; }
    .ql-bg-blue { background-color: #dbeafe !important; }
    .ql-bg-yellow { background-color: #fef9c3 !important; }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.2);
      border-radius: 10px;
    }
  `,x=Object.freeze(Object.defineProperty({__proto__:null,s_lt6XN40xVyU:h},Symbol.toStringTag,{value:"Module"})),w=t=>{if(d(i(()=>a(()=>Promise.resolve().then(()=>y),void 0),"s_LHsbWd9mbqg",[t])),b(i(()=>a(()=>Promise.resolve().then(()=>x),void 0),"s_lt6XN40xVyU")),!t.isOpen||!t.post)return null;const o=e=>new Date(e).toLocaleDateString("it-IT",{year:"numeric",month:"long",day:"numeric"}),u=e=>e.cover_image?e.cover_image.startsWith("media/")?"/"+e.cover_image:_(e.collectionId,e.id,e.cover_image):"/media/blog/default.webp",s=(e=>{if(!e)return null;const c=/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,r=e.match(c);return r&&r[2].length===11?r[2]:null})(t.post.video_link);return l("div",{onClick$:t.onClose},{class:"fixed inset-0 z-50 bg-black/90"},l("div",null,{class:"bg-white dark:bg-gray-900 w-full h-full overflow-hidden",onClick$:i(()=>a(()=>import("./q-UHXuoefL.js"),[]),"s_yCOChlU7I2k")},[l("button",{onClick$:t.onClose},{class:"fixed top-8 left-8 w-12 h-12 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-blue-500/20 rounded-full text-blue-600 flex items-center justify-center shadow-xl z-50 active:scale-90 transition-transform","aria-label":"Chiudi"},l("svg",null,{class:"w-6 h-6",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"3","stroke-linecap":"round","stroke-linejoin":"round"},l("path",null,{d:"M18 6L6 18M6 6l12 12"},null,3,null),3,null),2,null),l("div",null,{class:"h-full overflow-y-auto custom-scrollbar"},[l("div",null,{class:"relative h-[40vh] md:h-[60vh] overflow-hidden bg-gray-100 dark:bg-gray-800"},[l("img",{src:u(t.post)},{alt:n(e=>e.post.title,[t]),class:"w-full h-full object-contain"},null,3,null),l("div",null,{class:"absolute inset-x-0 bottom-0 p-8 md:p-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"},l("div",null,{class:"max-w-4xl mx-auto"},l("h2",null,{class:"text-3xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter"},n(e=>e.post.title,[t]),3,null),3,null),3,null)],1,null),l("div",null,{class:"max-w-4xl mx-auto p-8 md:p-16"},[l("div",null,{class:"flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 font-bold uppercase tracking-widest"},[l("svg",null,{xmlns:"http://www.w3.org/2000/svg",class:"h-5 w-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor"},l("path",null,{"stroke-linecap":"round","stroke-linejoin":"round","stroke-width":2,d:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"},null,3,null),3,null),l("span",null,null,o(t.post.date),1,null),t.post.expiration_date&&m(g,{children:[l("span",null,{class:"mx-2"},"•",3,null),l("span",null,null,["Scade il: ",o(t.post.expiration_date)],1,null)]},1,"80_0")],1,null),l("div",null,{class:"mb-12 max-w-none"},l("div",null,{class:"ql-container ql-snow",style:{border:"none"}},l("div",null,{class:"ql-editor !text-lg md:!text-xl !leading-relaxed",dangerouslySetInnerHTML:n(e=>e.post.content,[t])},null,3,null),3,null),3,null),s&&l("div",null,{class:"mb-12"},[l("div",null,{class:"flex items-center gap-2 mb-6"},[l("span",null,{class:"w-2 h-6 bg-red-600 rounded-full"},null,3,null),l("h3",null,{class:"text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest"},"Video",3,null)],3,null),l("div",null,{class:"rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-slate-950"},l("iframe",{src:`https://www.youtube.com/embed/${s}`},{class:"w-full aspect-video",title:n(e=>e.post.title,[t]),frameBorder:"0",allow:"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",allowFullscreen:!0},null,3,null),1,null)],1,"80_1"),t.post.external_link&&l("div",null,{class:"mt-12 pt-12 border-t border-gray-100 dark:border-gray-800"},l("a",null,{href:n(e=>e.post.external_link,[t]),target:"_blank",rel:"noopener noreferrer",class:"inline-flex items-center gap-4 px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-blue-500/20 uppercase tracking-widest"},[l("span",null,null,"Visita Link Esterno",3,null),l("svg",null,{class:"w-5 h-5",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"3","stroke-linecap":"round","stroke-linejoin":"round"},[l("path",null,{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"},null,3,null),l("polyline",null,{points:"15 3 21 3 21 9"},null,3,null),l("line",null,{x1:"10",y1:"14",x2:"21",y2:"3"},null,3,null)],3,null)],3,null),3,"80_2")],1,null)],1,null)],1,null),0,"80_3")},V=Object.freeze(Object.defineProperty({__proto__:null,s_uPINpyBTZag:w},Symbol.toStringTag,{value:"Module"})),v=({track:t})=>{const[o]=p();t(()=>o.isOpen),o.isOpen?document.body.style.overflow="hidden":document.body.style.overflow=""},y=Object.freeze(Object.defineProperty({__proto__:null,_hW:f,s_LHsbWd9mbqg:v},Symbol.toStringTag,{value:"Module"}));export{f as _hW,V as b,v as s_LHsbWd9mbqg,h as s_lt6XN40xVyU,w as s_uPINpyBTZag};
