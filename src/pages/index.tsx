import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const MapView = dynamic(() => import("../components/MapView"), { ssr: false });

type Point = { lat: number; lng: number };
type Home = { name: string; point: Point } | null;
type Favorite = { name: string; point: Point };

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function HomePage() {
  const [sheet, setSheet] = useState<"none" | "reserve" | "settings">("reserve");
  const [menuOpen, setMenuOpen] = useState(false);

  const [picked, setPicked] = useState<Point | null>(null);
  const [rideFrom, setRideFrom] = useState<Point | null>(null);
  const [rideTo, setRideTo] = useState<Point | null>(null);

  const [home, setHome] = useState<Home>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [payment, setPayment] = useState<"現金" | "キャッシュレス">("現金");

  // 追加：おでかけモード（確認ダイアログ）
  const [outingModalOpen, setOutingModalOpen] = useState(false);
  const [outingMode, setOutingMode] = useState<boolean>(() => false);

  useEffect(() => {
    setHome(load<Home>("home", null));
    setFavorites(load<Favorite[]>("favorites", []));
    setPayment(load("payment", "現金"));
    setOutingMode(load("outingMode", false));

    // 初回だけ確認（保存して2回目以降は出さない）
    const asked = load("askedOutingModal", false);
    if (!asked) setOutingModalOpen(true);
  }, []);

  const mode = useMemo(() => {
    if (!rideFrom) return "from";
    if (!rideTo) return "to";
    return "done";
  }, [rideFrom, rideTo]);

  function resetReserve() {
    setPicked(null);
    setRideFrom(null);
    setRideTo(null);
  }

  function confirmReserve() {
    const history = load<any[]>("history", []);
    history.unshift({ at: new Date().toISOString(), from: rideFrom, to: rideTo, payment });
    save("history", history.slice(0, 5));
    alert("予約を受け付けました（デモ）");
    resetReserve();
  }

  function closeOutingModal() {
    setOutingModalOpen(false);
    save("askedOutingModal", true);
  }

  function setOuting(enabled: boolean) {
    setOutingMode(enabled);
    save("outingMode", enabled);
    closeOutingModal();
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 18,
      }}
    >
      <div
        style={{
          width: "min(420px, 100vw)",
          height: "min(900px, 100vh)",
          borderRadius: 26,
          background: "#000",
          boxShadow: "0 20px 70px rgba(0,0,0,0.55)",
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {/* fake notch */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 160,
            height: 22,
            borderRadius: 14,
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.10)",
            zIndex: 3000,
            pointerEvents: "none",
          }}
        />

        {/* App surface */}
        <div style={{ position: "absolute", inset: 0, background: "#fff" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <MapView onPickPoint={(lat, lng) => setPicked({ lat, lng })} />
          </div>

          {/* left menu */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              position: "absolute",
              top: "calc(12px + env(safe-area-inset-top))",
              left: 12,
              zIndex: 1500,
              width: 44,
              height: 44,
              borderRadius: 22,
              border: "1px solid #ddd",
              background: "#fff",
              fontSize: 20,
              cursor: "pointer",
            }}
            aria-label="menu"
          >
            ☰
          </button>

          {/* outing mode small badge button */}
          <button
            onClick={() => setOutingModalOpen(true)}
            style={{
              position: "absolute",
              top: "calc(12px + env(safe-area-inset-top))",
              left: 66,
              zIndex: 1500,
              padding: "10px 12px",
              borderRadius: 18,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 12,
            }}
            title="おでかけモード"
          >
            {outingMode ? "おでかけON" : "おでかけOFF"}
          </button>

          {/* right payment */}
          <button
            onClick={() => {
              const next = payment === "現金" ? "キャッシュレス" : "現金";
              setPayment(next);
              save("payment", next);
            }}
            style={{
              position: "absolute",
              top: "calc(12px + env(safe-area-inset-top))",
              right: 12,
              zIndex: 1500,
              padding: "10px 12px",
              borderRadius: 18,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            {payment}
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(64px + env(safe-area-inset-top))",
                left: 12,
                zIndex: 1500,
                width: 280,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              }}
            >
              {[
                { label: "自宅を登録", onClick: () => setSheet("settings") },
                { label: "お気に入りの地点を登録", onClick: () => setSheet("settings") },
                { label: "お支払い方法", onClick: () => setSheet("settings") },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.onClick();
                    setMenuOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 14px",
                    border: "none",
                    borderBottom: "1px solid #eee",
                    textAlign: "left",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* bottom nav */}
          <div
            style={{
              position: "absolute",
              bottom: "calc(18px + env(safe-area-inset-bottom))",
              left: 0,
              right: 0,
              zIndex: 1500,
              display: "flex",
              justifyContent: "center",
              gap: 16,
              pointerEvents: "none",
            }}
          >
            <button onClick={() => setSheet("reserve")} style={pillButtonStyle(sheet === "reserve")}>
              よやく
            </button>
            <button onClick={() => setSheet("settings")} style={pillButtonStyle(sheet === "settings")}>
              せってい
            </button>
          </div>

          {/* bottom sheet */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1500,
              height: sheet === "none" ? 90 : 360,
              maxHeight: "70vh",
              background: "#fff",
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderTop: "1px solid #eaeaea",
              boxShadow: "0 -10px 30px rgba(0,0,0,0.10)",
              padding: 14,
              paddingBottom: "calc(14px + env(safe-area-inset-bottom))",
              transition: "height 0.2s ease",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 44, height: 5, borderRadius: 999, background: "#ddd", marginBottom: 10 }} />
            </div>

            {sheet === "reserve" && (
              <div>
                <h3 style={{ margin: "6px 0 10px", fontSize: 18 }}>よやく（デモ）</h3>
                <div style={{ fontSize: 14, color: "#444", marginBottom: 10 }}>
                  地図をタップして地点を選ぶ（{mode === "from" ? "乗車地点" : "降車地点"}）
                </div>

                <InfoRow label="選択中" value={picked ? fmt(picked) : "未選択"} />

                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button onClick={() => picked && setRideFrom(picked)} disabled={!picked || !!rideFrom} style={actionBtnStyle}>
                    ここを乗車地点にする
                  </button>
                  <button
                    onClick={() => picked && setRideTo(picked)}
                    disabled={!picked || !rideFrom || !!rideTo}
                    style={actionBtnStyle}
                  >
                    ここを目的地にする
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <InfoRow label="乗車地点" value={rideFrom ? fmt(rideFrom) : "未設定"} />
                  <InfoRow label="目的地" value={rideTo ? fmt(rideTo) : "未設定"} />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button onClick={resetReserve} style={subBtnStyle}>
                    リセット
                  </button>
                  <button
                    onClick={confirmReserve}
                    disabled={!rideFrom || !rideTo}
                    style={{ ...subBtnStyle, fontWeight: 900, opacity: !rideFrom || !rideTo ? 0.5 : 1 }}
                  >
                    予約確定
                  </button>
                </div>
              </div>
            )}

            {sheet === "settings" && (
              <div>
                <h3 style={{ margin: "6px 0 10px", fontSize: 18 }}>せってい（デモ）</h3>

                <section style={sectionStyle}>
                  <div style={sectionTitleStyle}>自宅を登録</div>
                  <div style={{ fontSize: 13, color: "#555" }}>地図で地点を選び、「自宅にする」を押す</div>
                  <InfoRow label="現在の自宅" value={home ? `${home.name} / ${fmt(home.point)}` : "未登録"} />
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button
                      onClick={() => {
                        if (!picked) return;
                        const next: Home = { name: "自宅", point: picked };
                        setHome(next);
                        save("home", next);
                      }}
                      disabled={!picked}
                      style={actionBtnStyle}
                    >
                      選択地点を自宅にする
                    </button>
                    <button
                      onClick={() => {
                        setHome(null);
                        save("home", null);
                      }}
                      style={subBtnStyle}
                    >
                      解除
                    </button>
                  </div>
                </section>

                <section style={sectionStyle}>
                  <div style={sectionTitleStyle}>お気に入りの地点</div>
                  <div style={{ fontSize: 13, color: "#555" }}>地図で地点を選び、「追加」を押す</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button
                      onClick={() => {
                        if (!picked) return;
                        const next = [{ name: `お気に入り${favorites.length + 1}`, point: picked }, ...favorites].slice(0, 5);
                        setFavorites(next);
                        save("favorites", next);
                      }}
                      disabled={!picked}
                      style={actionBtnStyle}
                    >
                      追加
                    </button>
                    <button
                      onClick={() => {
                        setFavorites([]);
                        save("favorites", []);
                      }}
                      style={subBtnStyle}
                    >
                      全削除
                    </button>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 14 }}>
                    {favorites.length === 0 ? (
                      <div style={{ color: "#777" }}>未登録</div>
                    ) : (
                      favorites.map((f, i) => (
                        <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                          {f.name}：{fmt(f.point)}
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section style={sectionStyle}>
                  <div style={sectionTitleStyle}>お支払い方法</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button onClick={() => { setPayment("現金"); save("payment", "現金"); }} style={payment === "現金" ? activeChip : chip}>
                      現金
                    </button>
                    <button onClick={() => { setPayment("キャッシュレス"); save("payment", "キャッシュレス"); }} style={payment === "キャッシュレス" ? activeChip : chip}>
                      キャッシュレス
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* ---- おでかけモード確認モーダル（UI寄せ） ---- */}
          {outingModalOpen && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2500,
                background: "rgba(0,0,0,0.25)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 18,
              }}
              onClick={() => closeOutingModal()}
            >
              <div
                style={{
                  width: "min(320px, 92vw)",
                  background: "#fff",
                  borderRadius: 18,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
                  padding: 16,
                  textAlign: "center",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ height: 10 }} />
                <div style={{ fontWeight: 900, fontSize: 16 }}>あんしんおでかけモードにしますか？</div>
                <div style={{ marginTop: 10, fontSize: 12, color: "#666", lineHeight: 1.5 }}>
                  画面が見やすくなり、ご家族などの見守りと連携を想定できます
                </div>

                {/* icon placeholder */}
                <div
                  style={{
                    margin: "14px auto 10px",
                    width: 110,
                    height: 80,
                    borderRadius: 12,
                    background: "#f3f3f3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    fontWeight: 900,
                  }}
                >
                  LOGO
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => setOuting(true)}
                    style={{
                      width: "100%",
                      height: 44,
                      borderRadius: 12,
                      border: "none",
                      background: "#2F6BFF",
                      color: "#fff",
                      fontWeight: 900,
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  >
                    はい
                  </button>
                  <button
                    onClick={() => setOuting(false)}
                    style={{
                      width: "100%",
                      height: 44,
                      borderRadius: 12,
                      border: "none",
                      background: "#FF5A5A",
                      color: "#fff",
                      fontWeight: 900,
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  >
                    いいえ
                  </button>
                </div>

                <div style={{ marginTop: 10, fontSize: 11, color: "#888" }}>
                  ※デモのため、機能は一部簡略化している
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function fmt(p: { lat: number; lng: number }) {
  return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0" }}>
      <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function pillButtonStyle(active: boolean) {
  return {
    pointerEvents: "auto" as const,
    width: 150,
    height: 56,
    borderRadius: 28,
    border: active ? "2px solid #111" : "1px solid #ddd",
    background: "#fff",
    fontSize: 18,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: active ? "0 10px 30px rgba(0,0,0,0.12)" : "0 6px 18px rgba(0,0,0,0.08)",
  };
}

const actionBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 10px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const subBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 10px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fafafa",
  cursor: "pointer",
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 10,
  marginTop: 10,
};

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: 900,
  marginBottom: 6,
};

const chip: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const activeChip: React.CSSProperties = {
  ...chip,
  border: "2px solid #111",
};
