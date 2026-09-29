import React, { useEffect, useRef } from "react";

export default function Bannerad() {
  const bannerRef = useRef(null);

  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.firstChild) {
      // 1. Pehle atOptions script banayein
      const atOptionsScript = document.createElement("script");
      atOptionsScript.type = "text/javascript";
      atOptionsScript.text = `
        atOptions = {
          'key' : 'fde1ad3daf1235e67becd075d1412eb7',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;
      bannerRef.current.appendChild(atOptionsScript);

      // 2. Phir invoke.js script banayein
      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.async = true;
      invokeScript.src = "https://www.highrevenueformat.com/fde1ad3daf1235e67becd075d1412eb7/invoke.js";
      bannerRef.current.appendChild(invokeScript);
    }
  }, []);

  return (
    <div 
      ref={bannerRef} 
      style={{ 
        textAlign: "center", 
        margin: "20px auto", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        overflow: "hidden",
        minHeight: "60px",
        width: "100%"
      }} 
    />
  );
}