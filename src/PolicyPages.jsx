import React, { useState } from 'react';

export default function PolicyPages() {
  const [activeTab, setActiveTab] = useState('about');

  // Professional Inline Styles
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '40px auto',
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#333333',
      lineHeight: '1.6',
    },
    header: {
      textAlign: 'center',
      marginBottom: '25px',
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1a73e8',
      marginBottom: '10px',
    },
    navButtons: {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      marginBottom: '30px',
    },
    button: (isActive) => ({
      padding: '10px 24px',
      fontSize: '15px',
      fontWeight: '600',
      borderRadius: '30px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: isActive ? '#1a73e8' : '#f1f3f4',
      color: isActive ? '#ffffff' : '#5f6368',
      transition: 'all 0.3s ease',
      boxShadow: isActive ? '0 2px 8px rgba(26, 115, 232, 0.3)' : 'none',
    }),
    contentBox: {
      padding: '10px 5px',
    },
    heading: {
      fontSize: '20px',
      color: '#202124',
      marginTop: '20px',
      marginBottom: '10px',
      borderBottom: '2px solid #f1f3f4',
      paddingBottom: '5px',
    },
    paragraph: {
      fontSize: '15px',
      color: '#444444',
      marginBottom: '15px',
    },
    list: {
      paddingLeft: '20px',
      marginBottom: '15px',
    },
    listItem: {
      marginBottom: '8px',
      fontSize: '15px',
      color: '#444444',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>ZEELOP Info Center</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>Aapki maloomat aur bharose ke liye</p>
      </div>

      {/* Navigation Buttons */}
      <div style={styles.navButtons}>
        <button 
          style={styles.button(activeTab === 'about')} 
          onClick={() => setActiveTab('about')}
        >
          About Us
        </button>
        <button 
          style={styles.button(activeTab === 'privacy')} 
          onClick={() => setActiveTab('privacy')}
        >
          Privacy Policy
        </button>
      </div>

      {/* Dynamic Content Display */}
      <div style={styles.contentBox}>
        {activeTab === 'about' ? (
          <div>
            <h3 style={styles.heading}>About ZEELOP</h3>
            <p style={styles.paragraph}>
              Welcome to <strong>ZEELOP</strong> – aapka apna behtareen online platform jahan aap games khel kar, lucky draws mein hissa le kar aur exciting rewards jeet sakte hain. Humara maqsad users ko ek aasan, mehfooz aur dilchasp tajurba entertainment ke sath provide karna hai.
            </p>
            <h3 style={styles.heading}>Humara Maqsad (Our Mission)</h3>
            <p style={styles.paragraph}>
              Hum ek aisa digital mahol banana chahte hain jahan har user bina kisi pareshani ke apne free waqt ko enjoy kar sake aur rewards hasil kar sake. ZEELOP team hamesha is koshish mein rehti hai ke platform ko mazeed behtar aur fast banaya jaye.
            </p>
          </div>
        ) : (
          <div>
            <h3 style={styles.heading}>Privacy Policy for ZEELOP</h3>
            {/* Yahan par galti thi jo theek kar di gayi hai */}
            <p style={styles.paragraph}>
              Last updated: September 20, 2026
            </p>
            <p style={styles.paragraph}>
              ZEELOP par aapki privacy hamari pehli tarjeeh hai. Yeh Privacy Policy document un qisam ki maloomat ko wazeh karta hai jo ZEELOP collect karta hai aur hum isay kaise istemal karte hain.
            </p>
            <h3 style={styles.heading}>Google AdSense & Cookies</h3>
            <p style={styles.paragraph}>
              Hum apni website par third-party vendors, jaise ke **Google AdSense**, ka istemal karte hain ads dikhane ke liye. Google cookies ka istemal karke users ko unki past visits ki buniyad par ads dikhata hai. 
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Google ka DART cookie istemal hota hai taake users ko ZEELOP aur internet ki doosri websites ki visits ke mutabiq ads dikhaye ja saken.</li>
              <li style={styles.listItem}>Users Google ad and content network privacy policy par jaakar DART cookie ka istemal khatam kar sakte hain.</li>
            </ul>
            <h3 style={styles.heading}>Consent</h3>
            <p style={styles.paragraph}>
              Hamari website istemal karke aap hamari Privacy Policy aur iski terms se agree karte hain.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}