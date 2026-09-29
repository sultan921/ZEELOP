import React, { useEffect, useRef } from "react";

export default function NativeBanner() {
  const nativeRef = useRef(null);

  useEffect(() => {
    if (nativeRef.current && !nativeRef.current.querySelector("script")) {
      const script = document.createElement("script");
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      script.src = "https://pl31566978.profitableratecpmnetwork.com/acb608746946d7ede6108b9f62e3fd55/invoke.js";
      nativeRef.current.appendChild(script);
    }
  }, []);

  return (
    <div style={{ width: "100%", margin: "20px auto", textAlign: "center" }}>
      {/* Adsterra ka required div container */}
      <div id="container-acb608746946d7ede6108b9f62e3fd55" ref={nativeRef}></div>
    </div>
  );
} 
