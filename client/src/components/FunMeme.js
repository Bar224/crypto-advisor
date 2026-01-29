import { useEffect, useState } from "react";

const MEMES = [
  {
    title: "Crypto pain",
    img: "https://img-9gag-fun.9cache.com/photo/ae9qODm_700bwp.webp",
  },
  {
    title: " ",
    img: "https://img-9gag-fun.9cache.com/photo/a0eGWRL_700bwp.webp",
  },
  {
    title: "You have IOU",
    img: "https://img-9gag-fun.9cache.com/photo/avyVedd_460swp.webp",
  },
  {
    title: "Market volatility",
    img: "https://img-9gag-fun.9cache.com/photo/a2vAX8O_460swp.webp",
  },
  {
    title: "People still trying to get rich from stocks be like in 2026",
    img: "https://i.imgflip.com/s6dhc.jpg", 
  },
];

export default function FunMeme() {
  const [meme, setMeme] = useState(null);

  function pickRandom() {
    const next = MEMES[Math.floor(Math.random() * MEMES.length)];
    setMeme(next);
  }

  useEffect(() => {
    pickRandom();
  }, []);

  if (!meme) {
    return <div style={styles.note}>Loading meme…</div>;
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.imgWrap}>
        <img src={meme.img} alt={meme.title} style={styles.img} />
      </div>

      <div style={styles.caption}>{meme.title}</div>

      <button onClick={pickRandom} style={styles.btn} type="button">
        ↻ New meme
      </button>
    </div>
  );
}

const styles = {
  wrap: {
    display: "grid",
    gap: 12,
    justifyItems: "center",
    textAlign: "center",
  },
  imgWrap: {
    width: "100%",
    maxHeight: 220,
    overflow: "hidden",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    background: "#fdfafa",
  },
  caption: {
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
  },
  btn: {
    padding: "8px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  note: {
    padding: 10,
    borderRadius: 12,
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    fontSize: 13,
  },
};
