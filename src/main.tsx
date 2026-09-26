import React, {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Target,
  Gift,
  BarChart3,
  FlaskConical,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Orbit,
  Users,
  Coins,
  Play,
  Pencil,
  Archive,
  X,
  Check,
} from "lucide-react";
import {
  api,
  gameUrl,
  type Player,
  type Campaign,
  type Award,
  type Analytics,
  type Deposit,
  type Audience,
} from "./api";
import "./style.css";

const tabs = [
  ["analytics", "Analytics", BarChart3],
  ["campaigns", "Campaigns", Activity],
  ["targeting", "Player targeting", Target],
  ["awards", "Awards", Gift],
  ["simulation", "Simulation", FlaskConical],
] as const;
type Tab = (typeof tabs)[number][0];
const descriptions: Record<Tab, string> = {
  analytics: "Understand player activity, retention, and reward performance.",
  campaigns: "Design the experiences that bring your players back.",
  targeting: "Build your audience. Make every interaction relevant.",
  awards: "Manage rewards from grant to fulfillment.",
  simulation:
    "Create demo players, fund balances, and explore player behavior.",
};
const rewardNames: Record<string, string> = {
  credits: "Credits",
  wheel: "Lucky wheel",
  chests: "Lucky chests",
  targets: "Moving targets",
  scratch: "Scratch card",
};
const emptyAudience: Audience = {
  playerIds: [],
  tags: [],
  minBalance: 0,
  maxBalance: 1000000,
  minDeposits: 0,
};
const number = (n?: number) => (n === undefined ? "—" : n.toLocaleString());
const date = (d: string) =>
  new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const list = (s: FormDataEntryValue | null) =>
  String(s || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
const formData = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  return new FormData(event.currentTarget);
};
const audienceFrom = (d: FormData): Audience => ({
  playerIds: list(d.get("playerIds")),
  tags: list(d.get("tags")),
  minBalance: Number(d.get("minBalance")),
  maxBalance: Number(d.get("maxBalance")),
  minDeposits: Number(d.get("minDeposits")),
});
function Badge({ value }: { value: string }) {
  return <span className={`badge ${value}`}>{value}</span>;
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <Orbit size={28} />
      <p>{children}</p>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function RewardFields({
  type = "credits",
  value = 10,
}: {
  type?: string;
  value?: number;
}) {
  return (
    <div className="form-row">
      <Field label="Reward experience">
        <select name="type" defaultValue={type}>
          {Object.entries(rewardNames).map(([value, title]) => (
            <option key={value} value={value}>
              {title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Credits / configured prize value">
        <input
          name="value"
          type="number"
          min="1"
          max="1000000"
          step="1"
          defaultValue={value}
          required
        />
      </Field>
    </div>
  );
}
function AudienceFields({ audience = emptyAudience }: { audience?: Audience }) {
  return (
    <>
      <div className="form-row">
        <Field label="Minimum balance">
          <input
            name="minBalance"
            type="number"
            min="0"
            max="1000000"
            defaultValue={audience.minBalance}
            required
          />
        </Field>
        <Field label="Maximum balance">
          <input
            name="maxBalance"
            type="number"
            min="0"
            max="1000000"
            defaultValue={audience.maxBalance}
            required
          />
        </Field>
      </div>
      <div className="form-row">
        <Field label="Minimum total deposits">
          <input
            name="minDeposits"
            type="number"
            min="0"
            max="1000000"
            defaultValue={audience.minDeposits}
            required
          />
        </Field>
        <Field label="Required tags (comma separated)">
          <input
            name="tags"
            defaultValue={audience.tags.join(", ")}
            placeholder="vip, simulated"
          />
        </Field>
      </div>
      <Field label="Player IDs (optional, comma separated)">
        <textarea
          name="playerIds"
          rows={2}
          defaultValue={audience.playerIds.join(", ")}
          placeholder="Leave empty to match all eligible players"
        />
      </Field>
    </>
  );
}

function App() {
  const [tab, setTab] = useState<Tab>("analytics");
  const [players, setPlayers] = useState<Player[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(
    null,
  );
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [showCampaign, setShowCampaign] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<{
    count: number;
    players: Player[];
  } | null>(null);
  const [cohort, setCohort] = useState<"real" | "simulated">("real");
  async function refresh() {
    setLoading(true);
    try {
      const [p, c, a, stats, d] = await Promise.all([
        api<Player[]>("/players"),
        api<Campaign[]>("/campaigns"),
        api<Award[]>("/awards"),
        api<Analytics>("/analytics"),
        api<Deposit[]>("/deposits"),
      ]);
      setPlayers(p);
      setCampaigns(c);
      setAwards(a);
      setAnalytics(stats);
      setDeposits(d);
      setReady(true);
    } catch (error) {
      setReady(false);
      setNotice({
        error: true,
        text:
          error instanceof Error ? error.message : "Unable to reach core-api.",
      });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function mutate(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const outcome = await action();
      setNotice({
        error: false,
        text: typeof outcome === "string" ? outcome : success,
      });
      await refresh();
    } catch (error) {
      setNotice({
        error: true,
        text: error instanceof Error ? error.message : "Operation failed.",
      });
    } finally {
      setBusy(false);
    }
  }
  const blocked = busy || !ready;
  const playerName = (id: string) =>
    players.find((p) => p._id === id)?.displayName || id.slice(0, 8);
  const active = players.filter((p) => p.status === "active");
  const PlayerSelect = () => (
    <Field label="Player">
      <select name="playerId" required defaultValue="">
        <option value="" disabled>
          Select a player
        </option>
        {active.map((p) => (
          <option value={p._id} key={p._id}>
            {p.displayName} · {number(p.balance)} credits
          </option>
        ))}
      </select>
    </Field>
  );
  const visiblePlayers = (preview?.players || players).filter((p) =>
    `${p.displayName} ${p.tags.join(" ")} ${p._id}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const title = tabs.find((t) => t[0] === tab)![1];
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="logo" href="/">
          <Orbit size={31} />
          orbit<span>.</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">O</span>
          <div>
            LiveOps workspace<small>Development environment</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {tabs.map(([id, name, Icon]) => (
            <button
              key={id}
              className={tab === id ? "nav-item selected" : "nav-item"}
              onClick={() => setTab(id)}
            >
              <Icon size={18} />
              {name}
              {tab === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className={`dot ${ready ? "green" : ""}`} />
          {loading
            ? "Connecting to core-api"
            : ready
              ? "MongoDB connected"
              : "Database unavailable"}
          <p>LOCAL POC · MOCK CREDITS</p>
        </div>
      </aside>
      <div className="content">
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span> <b>{title}</b>
          </span>
          <span className="environment">DEVELOPMENT</span>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <p className="eyebrow">LIVEOPS CONSOLE</p>
              <h1>{title}</h1>
              <p>{descriptions[tab]}</p>
            </div>
            <button
              className="button secondary"
              onClick={() => void refresh()}
              disabled={loading || busy}
            >
              <RefreshCw size={15} className={loading ? "rotate" : ""} />
              Refresh
            </button>
          </div>
          {notice && (
            <div
              role="status"
              className={`notice ${notice.error ? "error" : "success"}`}
            >
              {notice.error ? <X size={18} /> : <Check size={18} />}
              <span>{notice.text}</span>
              <button
                onClick={() => setNotice(null)}
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {!ready && !loading && (
            <div className="setup panel">
              <h2>Connect your database to get started</h2>
              <p>
                Add <code>MONGO_DB_CONNECTION_STRING</code> to{" "}
                <code>core-api/.env</code>, restart <code>npm run dev</code> in
                core-api, then refresh. Use MongoDB Atlas or a replica set.
              </p>
              <p>
                All data on this page comes from core-api. No sample metrics are
                substituted.
              </p>
            </div>
          )}
          {tab === "analytics" && (
            <>
              <div className="metrics">
                {[
                  [
                    Users,
                    "Players",
                    analytics?.playerCount,
                    `${analytics?.activePlayers ?? "—"} active profiles`,
                  ],
                  [
                    Activity,
                    "Completed spins",
                    analytics?.spins,
                    "Persisted game rounds",
                  ],
                  [
                    Coins,
                    "Mock deposits",
                    analytics?.deposits,
                    "Credits added through simulation",
                  ],
                  [
                    Gift,
                    "Awards granted",
                    analytics?.awards.total,
                    `${analytics?.awards.pending ?? "—"} awaiting mini-game play`,
                  ],
                ].map(([Icon, label, value, note], i) => {
                  const Component = Icon as typeof Users;
                  return (
                    <div className="metric" key={i}>
                      <div>
                        <span>{label as string}</span>
                        <Component size={18} />
                      </div>
                      <strong>
                        {ready ? number(value as number | undefined) : "—"}
                      </strong>
                      <small>{note as string}</small>
                    </div>
                  );
                })}
              </div>
              <div className="analytics-grid">
                <section className="panel">
                  <div className="section-heading">
                    <div>
                      <h2>Player activity</h2>
                      <p>Unique active players per UTC day · last 15 days</p>
                    </div>
                    <span className="legend">
                      <i />
                      All sessions
                    </span>
                  </div>
                  <div className="chart">
                    {analytics?.activity.map((d) => (
                      <div
                        className="chart-column"
                        key={d.date}
                        title={`${d.date}: ${d.players} players, ${d.sessions} sessions (${d.simulated} simulated)`}
                      >
                        <span>{d.players || ""}</span>
                        <div
                          style={{
                            height: `${Math.max(2, (d.players / Math.max(1, ...analytics.activity.map((a) => a.players))) * 150)}px`,
                          }}
                        />
                        <small>{d.date.slice(8)}</small>
                      </div>
                    )) || <Empty>No activity yet</Empty>}
                  </div>
                  <p className="chart-note">
                    Includes clearly marked simulation sessions. Hover a bar for
                    the breakdown.
                  </p>
                </section>
                <section className="panel">
                  <div className="section-heading">
                    <div>
                      <h2>Return retention</h2>
                      <p>Return on exactly day 1 / day 7</p>
                    </div>
                  </div>
                  <div className="segmented">
                    <button
                      className={cohort === "real" ? "active" : ""}
                      onClick={() => setCohort("real")}
                    >
                      Game players
                    </button>
                    <button
                      className={cohort === "simulated" ? "active" : ""}
                      onClick={() => setCohort("simulated")}
                    >
                      Seeded cohort
                    </button>
                  </div>
                  <div className="retention">
                    {(["d1", "d7"] as const).map((key) => {
                      const data = analytics?.retention[cohort][key];
                      return (
                        <div key={key}>
                          <span>{key.toUpperCase()} retention</span>
                          <strong>
                            {data?.rate == null ? "—" : `${data.rate}%`}
                          </strong>
                          <small>
                            {data?.returned ?? 0} / {data?.eligible ?? 0} mature
                            players
                          </small>
                        </div>
                      );
                    })}
                  </div>
                  <p className="chart-note">
                    Only completed UTC observation days count. A new cohort
                    needs time to mature.
                  </p>
                </section>
              </div>
              <div className="analytics-grid">
                <section className="panel">
                  <h2>Credit movement</h2>
                  <div className="ledger">
                    {[
                      ["Total stakes", analytics?.totalBet],
                      ["Spin payouts", analytics?.totalPayout],
                      ["Award credits", analytics?.awards.creditValue],
                      ["Current player balances", analytics?.totalBalance],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <span>{label}</span>
                        <strong>
                          {ready ? number(value as number | undefined) : "—"}{" "}
                          <small>credits</small>
                        </strong>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="panel">
                  <h2>Award delivery</h2>
                  <div className="ledger">
                    {(["pending", "credited", "revoked"] as const).map((s) => (
                      <div key={s}>
                        <Badge value={s} />
                        <strong>
                          {ready ? number(analytics?.awards[s]) : "—"}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <p className="chart-note">
                    Credits are delivered immediately. Mini-game awards remain
                    pending until those games are implemented.
                  </p>
                </section>
              </div>
            </>
          )}
          {tab === "campaigns" && (
            <>
              <div className="toolbar">
                <span>{campaigns.length} campaigns</span>
                <button
                  className="button primary"
                  disabled={blocked}
                  onClick={() => {
                    setEditCampaign(null);
                    setShowCampaign(true);
                  }}
                >
                  <Plus size={16} />
                  Create campaign
                </button>
              </div>
              {showCampaign && (
                <section className="panel form-panel">
                  <div className="section-heading">
                    <h2>{editCampaign ? "Edit campaign" : "New campaign"}</h2>
                    <button
                      className="icon-button"
                      onClick={() => setShowCampaign(false)}
                      aria-label="Close campaign form"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <form
                    key={editCampaign?._id || "new"}
                    onSubmit={(e) => {
                      const d = formData(e);
                      void mutate(async () => {
                        await api(
                          editCampaign
                            ? `/campaigns/${editCampaign._id}`
                            : "/campaigns",
                          editCampaign ? "PUT" : "POST",
                          {
                            name: d.get("name"),
                            description: d.get("description"),
                            status: d.get("status"),
                            rewardType: d.get("type"),
                            rewardValue: Number(d.get("value")),
                            audience: audienceFrom(d),
                          },
                        );
                        setShowCampaign(false);
                      }, "Campaign saved.");
                    }}
                  >
                    <fieldset disabled={blocked}>
                      <div className="form-row">
                        <Field label="Campaign name">
                          <input
                            name="name"
                            maxLength={100}
                            defaultValue={editCampaign?.name}
                            required
                            placeholder="Weekend welcome"
                          />
                        </Field>
                        <Field label="Status">
                          <select
                            name="status"
                            defaultValue={editCampaign?.status || "draft"}
                          >
                            {["draft", "active", "paused", "archived"].map(
                              (s) => (
                                <option key={s}>{s}</option>
                              ),
                            )}
                          </select>
                        </Field>
                      </div>
                      <Field label="Description">
                        <textarea
                          name="description"
                          maxLength={500}
                          defaultValue={editCampaign?.description}
                          rows={2}
                        />
                      </Field>
                      <RewardFields
                        type={editCampaign?.rewardType}
                        value={editCampaign?.rewardValue}
                      />
                      <h3>Player eligibility</h3>
                      <AudienceFields
                        audience={
                          editCampaign?.audience || {
                            ...emptyAudience,
                            playerIds: selected,
                          }
                        }
                      />
                      <p className="help">
                        All filters apply together. Each player can receive this
                        campaign once. Issuing is manual.
                      </p>
                      <button className="button primary" type="submit">
                        Save campaign
                      </button>
                    </fieldset>
                  </form>
                </section>
              )}
              <div className="campaign-grid">
                {campaigns.map((c) => (
                  <section className="campaign-card" key={c._id}>
                    <div className="section-heading">
                      <span className="campaign-icon">
                        <Gift size={21} />
                      </span>
                      <Badge value={c.status} />
                    </div>
                    <h2>{c.name}</h2>
                    <p>{c.description || "No description"}</p>
                    <div className="campaign-reward">
                      <span>{rewardNames[c.rewardType]}</span>
                      <strong>
                        {c.rewardValue}{" "}
                        <small>
                          {c.rewardType === "credits"
                            ? "credits"
                            : "prize value"}
                        </small>
                      </strong>
                    </div>
                    <p className="help">
                      {c.audience.playerIds.length
                        ? `${c.audience.playerIds.length} selected players`
                        : "Matching active players"}
                      {c.audience.tags.length
                        ? ` · ${c.audience.tags.join(", ")}`
                        : ""}
                    </p>
                    <div className="card-actions">
                      <button
                        className="button secondary"
                        disabled={blocked}
                        onClick={() => {
                          setEditCampaign(c);
                          setShowCampaign(true);
                        }}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        className="button primary"
                        disabled={blocked || c.status !== "active"}
                        onClick={() =>
                          void mutate(async () => {
                            const r = await api<{
                              granted: number;
                              skipped: number;
                            }>(`/campaigns/${c._id}/issue`, "POST");
                            return `${r.granted} awards issued; ${r.skipped} already issued or no longer eligible.`;
                          }, "Campaign issuance complete. Refresh awards for results.")
                        }
                      >
                        <Play size={14} />
                        Issue
                      </button>
                      <button
                        className="icon-button"
                        disabled={blocked || c.status === "archived"}
                        title="Archive campaign"
                        aria-label={`Archive ${c.name}`}
                        onClick={() =>
                          void mutate(
                            () => api(`/campaigns/${c._id}`, "DELETE"),
                            "Campaign archived.",
                          )
                        }
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  </section>
                ))}
              </div>
              {!campaigns.length && (
                <Empty>
                  No campaigns yet. Create your first player experience.
                </Empty>
              )}
            </>
          )}
          {tab === "targeting" && (
            <>
              <div className="two-column">
                <section className="panel">
                  <h2>{editPlayer ? "Edit player" : "Create a player"}</h2>
                  <form
                    key={editPlayer?._id || "new-player"}
                    onSubmit={(e) => {
                      const d = formData(e);
                      void mutate(async () => {
                        await api(
                          editPlayer
                            ? `/players/${editPlayer._id}`
                            : "/players",
                          editPlayer ? "PATCH" : "POST",
                          {
                            displayName: d.get("displayName"),
                            tags: list(d.get("tags")),
                            ...(editPlayer
                              ? { status: d.get("status") }
                              : { balance: Number(d.get("balance")) }),
                          },
                        );
                        setEditPlayer(null);
                      }, "Player saved.");
                    }}
                  >
                    <fieldset disabled={blocked}>
                      <Field label="Display name">
                        <input
                          name="displayName"
                          maxLength={50}
                          defaultValue={editPlayer?.displayName}
                          required
                          placeholder="Alex Rivers"
                        />
                      </Field>
                      <div className="form-row">
                        {editPlayer ? (
                          <Field label="Status">
                            <select
                              name="status"
                              defaultValue={editPlayer.status}
                            >
                              <option>active</option>
                              <option>archived</option>
                            </select>
                          </Field>
                        ) : (
                          <Field label="Starting credits">
                            <input
                              type="number"
                              name="balance"
                              min="0"
                              max="1000000"
                              defaultValue={100}
                              required
                            />
                          </Field>
                        )}
                        <Field label="Tags">
                          <input
                            name="tags"
                            defaultValue={editPlayer?.tags.join(", ")}
                            placeholder="vip, returning"
                          />
                        </Field>
                      </div>
                      <div className="card-actions">
                        <button className="button primary" type="submit">
                          {editPlayer ? "Save changes" : "Create player"}
                        </button>
                        {editPlayer && (
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => setEditPlayer(null)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </fieldset>
                  </form>
                </section>
                <section className="panel">
                  <h2>Audience preview</h2>
                  <form
                    onSubmit={(e) => {
                      const d = formData(e);
                      void mutate(
                        async () =>
                          setPreview(
                            await api(
                              "/targeting/preview",
                              "POST",
                              audienceFrom(d),
                            ),
                          ),
                        "Audience preview updated.",
                      );
                    }}
                  >
                    <fieldset disabled={blocked}>
                      <AudienceFields />
                      <button className="button secondary" type="submit">
                        <Target size={15} />
                        Preview matching players
                      </button>
                    </fieldset>
                  </form>
                </section>
              </div>
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <h2>
                      Players{" "}
                      {preview && <small>· {preview.count} matches</small>}
                    </h2>
                    <p>Latest 500 profiles · {selected.length} selected</p>
                  </div>
                  <div className="card-actions">
                    {preview && (
                      <button
                        className="button secondary"
                        onClick={() => setPreview(null)}
                      >
                        Clear filters
                      </button>
                    )}
                    <button
                      className="button primary"
                      disabled={!selected.length || blocked}
                      onClick={() => {
                        setTab("campaigns");
                        setEditCampaign(null);
                        setShowCampaign(true);
                      }}
                    >
                      Create targeted campaign
                    </button>
                  </div>
                </div>
                <input
                  className="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search names, tags, or IDs"
                  aria-label="Search players"
                />
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th></th>
                        <th>Player</th>
                        <th>Balance</th>
                        <th>Tags</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePlayers.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Select ${p.displayName}`}
                              checked={selected.includes(p._id)}
                              onChange={(e) =>
                                setSelected(
                                  e.target.checked
                                    ? [...selected, p._id]
                                    : selected.filter((id) => id !== p._id),
                                )
                              }
                            />
                          </td>
                          <td>
                            <b>{p.displayName}</b>
                            <small>{p._id.slice(0, 8)}</small>
                          </td>
                          <td>{number(p.balance)} cr</td>
                          <td>{p.tags.join(", ") || "—"}</td>
                          <td>
                            <Badge value={p.status} />
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="icon-button"
                                title="Edit player"
                                aria-label={`Edit ${p.displayName}`}
                                onClick={() => setEditPlayer(p)}
                              >
                                <Pencil size={15} />
                              </button>
                              {p.status === "active" && (
                                <>
                                  <a
                                    className="icon-button"
                                    title="Open game as player"
                                    aria-label={`Play as ${p.displayName}`}
                                    href={gameUrl(p)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <ArrowUpRight size={17} />
                                  </a>
                                  <button
                                    className="icon-button"
                                    disabled={blocked}
                                    title="Archive player"
                                    aria-label={`Archive ${p.displayName}`}
                                    onClick={() =>
                                      void mutate(
                                        () =>
                                          api(`/players/${p._id}`, "DELETE"),
                                        "Player archived.",
                                      )
                                    }
                                  >
                                    <Archive size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!visiblePlayers.length && <Empty>No matching players</Empty>}
              </section>
            </>
          )}
          {tab === "awards" && (
            <>
              <section className="panel form-panel">
                <h2>Grant a reward</h2>
                <form
                  onSubmit={(e) => {
                    const d = formData(e);
                    void mutate(
                      () =>
                        api("/awards", "POST", {
                          playerId: d.get("playerId"),
                          type: d.get("type"),
                          value: Number(d.get("value")),
                          requestId: crypto.randomUUID(),
                        }),
                      "Award granted. Credit rewards are already in the player balance.",
                    );
                  }}
                >
                  <fieldset disabled={blocked}>
                    <PlayerSelect />
                    <RewardFields />
                    <p className="help">
                      Credits apply immediately. Mini-games are recorded as
                      pending awards; redemption comes with their
                      implementation.
                    </p>
                    <button className="button primary" type="submit">
                      <Gift size={15} />
                      Grant award
                    </button>
                  </fieldset>
                </form>
              </section>
              <section className="panel">
                <div className="section-heading">
                  <h2>Award ledger</h2>
                  <span className="muted">Latest 500 grants</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Experience</th>
                        <th>Value</th>
                        <th>Campaign</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {awards.map((a) => (
                        <tr key={a._id}>
                          <td>{playerName(a.playerId)}</td>
                          <td>{rewardNames[a.type]}</td>
                          <td>{a.value}</td>
                          <td>
                            {campaigns.find((c) => c._id === a.campaignId)
                              ?.name || "Manual grant"}
                          </td>
                          <td>
                            <Badge value={a.status} />
                          </td>
                          <td>{date(a.createdAt)}</td>
                          <td>
                            {a.status === "pending" && (
                              <button
                                className="button secondary small"
                                disabled={blocked}
                                onClick={() =>
                                  void mutate(
                                    () =>
                                      api(`/awards/${a._id}/revoke`, "POST"),
                                    "Pending award revoked.",
                                  )
                                }
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!awards.length && <Empty>No awards granted yet</Empty>}
              </section>
            </>
          )}
          {tab === "simulation" && (
            <>
              <div className="simulation-banner">
                <FlaskConical size={22} />
                <div>
                  <b>A controlled space to explore</b>
                  <p>
                    These actions write labeled simulation data to MongoDB and
                    update live player balances.
                  </p>
                </div>
              </div>
              <div className="three-column">
                <section className="panel">
                  <span className="form-icon">
                    <Users size={23} />
                  </span>
                  <h2>Seed a cohort</h2>
                  <p className="help">
                    Create players dated 14 days ago with 100 starting credits.
                    Half return on D1, a quarter on D7. All are tagged
                    simulated.
                  </p>
                  <form
                    onSubmit={(e) => {
                      const d = formData(e);
                      void mutate(
                        () =>
                          api("/simulation/seed", "POST", {
                            count: Number(d.get("count")),
                          }),
                        "Simulated cohort created.",
                      );
                    }}
                  >
                    <fieldset disabled={blocked}>
                      <Field label="Number of players">
                        <input
                          name="count"
                          type="number"
                          min="1"
                          max="100"
                          defaultValue="12"
                          required
                        />
                      </Field>
                      <button className="button primary" type="submit">
                        Create cohort
                      </button>
                    </fieldset>
                  </form>
                </section>
                <section className="panel">
                  <span className="form-icon">
                    <Coins size={23} />
                  </span>
                  <h2>Mock deposit</h2>
                  <p className="help">
                    Add credits to a player's balance. An open game receives the
                    updated balance over WebSocket.
                  </p>
                  <form
                    onSubmit={(e) => {
                      const d = formData(e);
                      void mutate(
                        () =>
                          api("/simulation/deposits", "POST", {
                            playerId: d.get("playerId"),
                            amount: Number(d.get("amount")),
                            requestId: crypto.randomUUID(),
                          }),
                        "Mock deposit completed.",
                      );
                    }}
                  >
                    <fieldset disabled={blocked}>
                      <PlayerSelect />
                      <Field label="Credits">
                        <input
                          name="amount"
                          type="number"
                          min="1"
                          max="1000000"
                          defaultValue="100"
                          required
                        />
                      </Field>
                      <button className="button primary" type="submit">
                        Deposit credits
                      </button>
                    </fieldset>
                  </form>
                </section>
                <section className="panel">
                  <span className="form-icon">
                    <Activity size={23} />
                  </span>
                  <h2>Simulate a return</h2>
                  <p className="help">
                    Record a simulated session. The date must be on or after the
                    player's creation date.
                  </p>
                  <form
                    onSubmit={(e) => {
                      const d = formData(e);
                      void mutate(
                        () =>
                          api("/simulation/sessions", "POST", {
                            playerId: d.get("playerId"),
                            daysAgo: Number(d.get("daysAgo")),
                          }),
                        "Simulated session recorded.",
                      );
                    }}
                  >
                    <fieldset disabled={blocked}>
                      <PlayerSelect />
                      <Field label="Days ago">
                        <input
                          name="daysAgo"
                          type="number"
                          min="0"
                          max="90"
                          defaultValue="0"
                          required
                        />
                      </Field>
                      <button className="button primary" type="submit">
                        Record session
                      </button>
                    </fieldset>
                  </form>
                </section>
              </div>
              <section className="panel">
                <h2>Mock deposits</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((d) => (
                        <tr key={d._id}>
                          <td>{playerName(d.playerId)}</td>
                          <td className="positive">+{number(d.amount)} cr</td>
                          <td>{date(d.createdAt)}</td>
                          <td>
                            <Badge value="simulated" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!deposits.length && <Empty>No mock deposits yet</Empty>}
              </section>
            </>
          )}
        </main>
        <footer>
          ORBIT LIVEOPS <span>Local development · Mock credits only</span>
        </footer>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
