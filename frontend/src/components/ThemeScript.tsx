/**
 * Blocking script that applies the saved theme before first paint, so there is
 * no flash of the wrong colour scheme. If no preference is saved, the CSS
 * prefers-color-scheme media query decides.
 */
export default function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
