import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Order = {
  id: string;
  customer_username: string;
  customer_contact: string;
  amount_cents: number;
  currency: string;
  payment_status: string;
  fulfillment_status: string;
  delivery_notes: string;
  created_at: string;
};
type OrderItem = { id: string; product_name: string; quantity: number; unit_price_cents: number; currency: string };
type PaymentRecord = { id: string; provider: string; provider_reference: string | null; amount_cents: number; currency: string; status: string; verified_at: string | null };
type FulfillmentRecord = { id: string; action: string; note: string; created_at: string; actor_id: string | null };

function price(cents: number, currency: string) {
  return currency === "PHP" ? `₱${(cents / 100).toLocaleString("en-PH", { maximumFractionDigits: 2 })}` : `${currency} ${(cents / 100).toFixed(2)}`;
}

export default function AdminOrders({ client }: { client: SupabaseClient }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [history, setHistory] = useState<FulfillmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOrders = useCallback(async () => {
    const { data, error: queryError } = await client.from("orders")
      .select("id,customer_username,customer_contact,amount_cents,currency,payment_status,fulfillment_status,delivery_notes,created_at")
      .order("created_at", { ascending: false }).limit(200);
    if (queryError) setError(`Could not load orders: ${queryError.message}`);
    else {
      setOrders((data ?? []) as Order[]);
      setError("");
    }
    setLoading(false);
  }, [client]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  const selectedOrder = orders.find((order) => order.id === selectedId) ?? null;
  useEffect(() => {
    let active = true;
    if (!selectedId) {
      setItems([]);
      setPayments([]);
      setHistory([]);
      return;
    }
    const loadDetails = async () => {
      const [itemsResult, paymentsResult, historyResult] = await Promise.all([
        client.from("order_items").select("id,product_name,quantity,unit_price_cents,currency").eq("order_id", selectedId),
        client.from("payment_records").select("id,provider,provider_reference,amount_cents,currency,status,verified_at").eq("order_id", selectedId).order("created_at", { ascending: false }),
        client.from("fulfillment_records").select("id,action,note,created_at,actor_id").eq("order_id", selectedId).order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      const detailError = itemsResult.error || paymentsResult.error || historyResult.error;
      if (detailError) setError(`Could not load order details: ${detailError.message}`);
      else {
        setItems((itemsResult.data ?? []) as OrderItem[]);
        setPayments((paymentsResult.data ?? []) as PaymentRecord[]);
        setHistory((historyResult.data ?? []) as FulfillmentRecord[]);
        setError("");
      }
    };
    void loadDetails().catch(() => { if (active) setError("Could not load the order history."); });
    return () => { active = false; };
  }, [client, selectedId]);

  const filteredOrders = useMemo(() => orders.filter((order) =>
    `${order.id} ${order.customer_username} ${order.customer_contact}`.toLowerCase().includes(search.toLowerCase())
  ), [orders, search]);
  const pageSize = 20;
  const visibleOrders = filteredOrders.slice(page * pageSize, (page + 1) * pageSize);
  const pageCount = Math.ceil(filteredOrders.length / pageSize);

  const reviewPayment = async (decision: "verified" | "failed") => {
    if (!selectedOrder) return;
    const prompt = decision === "verified"
      ? "Confirm that you checked a genuine payment outside this website. Enter the verification source/reference:"
      : "Enter why this payment was marked failed:";
    const verificationNote = window.prompt(prompt, note);
    if (verificationNote === null || !verificationNote.trim()) {
      setError("A payment review note is required.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: rpcError } = await client.rpc("review_order_payment", {
      p_order_id: selectedOrder.id,
      p_decision: decision,
      p_note: verificationNote.trim(),
    });
    if (rpcError) setError(`Could not review payment: ${rpcError.message}`);
    else {
      setMessage(`Payment marked ${decision}. No payment was processed by this website.`);
      setNote("");
      await loadOrders();
    }
    setSaving(false);
  };

  const setFulfillment = async (status: "processing" | "fulfilled" | "cancelled") => {
    if (!selectedOrder) return;
    if (status === "fulfilled" && !window.confirm("Confirm that the paid order was delivered manually?")) return;
    if (status === "cancelled" && !window.confirm("Cancel this order? This does not issue a refund.")) return;
    setSaving(true);
    setError("");
    const { error: rpcError } = await client.rpc("update_order_fulfillment", {
      p_order_id: selectedOrder.id,
      p_status: status,
      p_note: note.trim(),
    });
    if (rpcError) setError(`Could not update fulfillment: ${rpcError.message}`);
    else {
      setMessage(`Order marked ${status}.`);
      setNote("");
      await loadOrders();
    }
    setSaving(false);
  };

  return <section className="dashboard-panel">
    <div className="dashboard-panel-heading"><span className="eyebrow">Payment and delivery oversight</span><h2>Order management</h2><p>Checkout remains disabled until a payment provider is configured. Only manually verified external payments can move to fulfillment.</p></div>
    {error && <p className="dashboard-message error" role="alert">{error}</p>}
    {message && <p className="dashboard-message" role="status">{message}</p>}
    <div className="orders-layout">
      <div>
        <label className="order-search">Search orders<input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Order ID, player, or contact" /></label>
        {loading ? <p className="muted">Loading orders…</p> : visibleOrders.length ? <div className="product-admin-list">
          {visibleOrders.map((order) => <button className={`order-list-item ${selectedId === order.id ? "selected" : ""}`} type="button" key={order.id} onClick={() => { setSelectedId(order.id); setMessage(""); }}>
            <span><strong>{order.customer_username || "Player not specified"}</strong><small>{order.id} · {new Date(order.created_at).toLocaleDateString()}</small></span>
            <span><strong>{price(order.amount_cents, order.currency)}</strong><small>{order.payment_status} · {order.fulfillment_status}</small></span>
          </button>)}
        </div> : <p className="muted">No orders are recorded. The public checkout is intentionally unavailable while payments are unconfigured.</p>}
        {pageCount > 1 && <div className="pagination-controls"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page + 1} of {pageCount}</span><button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
      </div>
      {selectedOrder && <article className="order-detail-card">
        <span className="card-kicker">Order detail</span><h3>{selectedOrder.customer_username || "Player not specified"}</h3>
        <p>{selectedOrder.customer_contact || "No contact provided"}</p><p><strong>{price(selectedOrder.amount_cents, selectedOrder.currency)}</strong></p>
        <p>Payment: <strong>{selectedOrder.payment_status}</strong> · Fulfillment: <strong>{selectedOrder.fulfillment_status}</strong></p>
        <h4>Items</h4>{items.length ? <ul>{items.map((item) => <li key={item.id}>{item.product_name} × {item.quantity} · {price(item.unit_price_cents, item.currency)} each</li>)}</ul> : <p className="muted">No order-item snapshots are attached.</p>}
        <label>Review / delivery note<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Verification reference or manual delivery note" /></label>
        <div className="form-actions"><button type="button" disabled={saving} onClick={() => void reviewPayment("verified")}>Verify external payment</button><button type="button" disabled={saving} onClick={() => void reviewPayment("failed")}>Mark payment failed</button></div>
        {selectedOrder.payment_status === "verified" && <div className="form-actions"><button type="button" disabled={saving} onClick={() => void setFulfillment("processing")}>Mark processing</button><button type="button" disabled={saving} onClick={() => void setFulfillment("fulfilled")}>Mark fulfilled</button></div>}
        {selectedOrder.fulfillment_status !== "fulfilled" && <button className="danger-action" type="button" disabled={saving} onClick={() => void setFulfillment("cancelled")}>Cancel order</button>}
        <h4>Payment history</h4>{payments.length ? payments.map((payment) => <p key={payment.id}>{payment.provider} · {payment.status} · {price(payment.amount_cents, payment.currency)} {payment.provider_reference && `· ${payment.provider_reference}`}</p>) : <p className="muted">No payment verification recorded.</p>}
        <h4>Fulfillment audit</h4>{history.length ? history.map((entry) => <p key={entry.id}>{new Date(entry.created_at).toLocaleString()} · {entry.action} · {entry.note || "No note"}</p>) : <p className="muted">No fulfillment activity recorded.</p>}
      </article>}
    </div>
  </section>;
}
