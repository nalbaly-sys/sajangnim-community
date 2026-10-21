/* STEP 16: AdSense site verification */
(function(){
  const PUBLISHER_ID='ca-pub-4440430005819024';
  let meta=document.head.querySelector('meta[name="google-adsense-account"]');
  if(!meta){
    meta=document.createElement('meta');
    meta.name='google-adsense-account';
    document.head.appendChild(meta);
  }
  meta.content=PUBLISHER_ID;
})();
