import React, { useEffect, useRef } from "react";

export default function Banner320() {
  const bannerRef = useRef(null);

  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.firstChild) {
      // 1. atOptions configuration for 320x50 banner
      const atOptionsScript = document.createElement("script");
      atOptionsScript.type = "text/javascript";
      atOptionsScript.text = `
        atOptions = {
          'key' : '5df488f8701c06ebf1c4cca6d97ed497',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;
      bannerRef.current.appendChild(atOptionsScript);

      // 2. invoke.js script for 320x50 banner
      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.async = true;
      invokeScript.src = "https://www.highrevenueformat.com/5df488f8701c06ebf1c4cca6d97ed497/invoke.js";
      bannerRef.current.appendChild(invokeScript);
    }
  }, []);

  return (
    <div 
      ref={bannerRef} 
      style={{ 
        textAlign: "center", 
        margin: "15px auto", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        overflow: "hidden",
        minHeight: "50px",
        width: "100%"
      }} 
    />
  );
}
