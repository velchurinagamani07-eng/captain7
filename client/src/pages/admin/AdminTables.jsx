import { useState, useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Plus, Trash2, Edit, Download, Printer, ShieldAlert } from "lucide-react";
import { collection, doc, deleteDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase.js";
import { useCollection } from "../../hooks/useFirestore.js";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";

export default function AdminTables() {
  const { data: tables, loading, error } = useCollection("tables", [], { live: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState("");
  
  const [formState, setFormState] = useState({
    tableNumber: "",
    label: "",
    isOccupied: false
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleOpenAdd = () => {
    setFormState({ tableNumber: "", label: "", isOccupied: false });
    setEditId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (table) => {
    setFormState({
      tableNumber: table.tableNumber,
      label: table.label,
      isOccupied: table.isOccupied || false
    });
    setEditId(table.id);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const tableNum = Number(formState.tableNumber);
    if (isNaN(tableNum) || tableNum <= 0) {
      showToast("Please enter a valid table number");
      return;
    }
    if (!formState.label.trim()) {
      showToast("Label is required");
      return;
    }

    try {
      const payload = {
        tableNumber: tableNum,
        label: formState.label.trim(),
        isOccupied: formState.isOccupied,
        updatedAt: serverTimestamp()
      };

      if (!editId) {
        // Add new table
        const id = crypto.randomUUID();
        const ref = doc(db, "tables", id);
        await setDoc(ref, {
          ...payload,
          currentOrderId: null,
          createdAt: serverTimestamp()
        });
        showToast("Table created successfully!");
      } else {
        // Edit existing table
        const ref = doc(db, "tables", editId);
        await updateDoc(ref, payload);
        showToast("Table updated successfully!");
      }
      setModalOpen(false);
    } catch (err) {
      showToast(err.message || "Failed to save table");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this table?")) return;
    try {
      await deleteDoc(doc(db, "tables", id));
      showToast("Table deleted successfully!");
    } catch (err) {
      showToast(err.message || "Failed to delete table");
    }
  };

  // Triggers downloading the QR code canvas as a PNG
  const downloadQRCode = (tableNumber, label) => {
    const canvas = document.getElementById(`qr-canvas-${tableNumber}`);
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `C7_QR_Table_${tableNumber}_${label.replace(/\s+/g, "_")}.png`;
    link.href = url;
    link.click();
  };

  // Opens browser printing for the A4-styled print container
  const handlePrintAll = () => {
    window.print();
  };

  // Sorted tables list
  const sortedTables = useMemo(() => {
    return [...tables].sort((a, b) => (a.tableNumber || 0) - (b.tableNumber || 0));
  }, [tables]);

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="font-display text-5xl text-white">TABLE CONFIGURATION</h1>
          <p className="mt-2 text-sm text-white/55">Create tables, set names, and manage real-time dine-in QR codes.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={handlePrintAll} variant="secondary" className="flex items-center gap-2">
            <Printer size={16} /> Print All QR Codes
          </Button>
          <Button onClick={handleOpenAdd} className="flex items-center gap-2">
            <Plus size={16} /> Add Table
          </Button>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="no-print">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-500 py-10 justify-center">
            <ShieldAlert size={20} /> Failed to load tables: {error}
          </div>
        ) : sortedTables.length === 0 ? (
          <div className="grid min-h-[260px] place-items-center text-center text-white/45 border border-dashed border-white/10 rounded-xl bg-captain-card">
            No tables configured yet. Click "Add Table" to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedTables.map((table) => {
              const qrUrl = `${window.location.origin}/menu?table=${table.tableNumber}`;
              return (
                <Card key={table.id} className="p-5 flex flex-col justify-between items-center border border-white/5 bg-captain-card space-y-4">
                  {/* Table title */}
                  <div className="w-full flex justify-between items-center border-b border-white/5 pb-2.5">
                    <div>
                      <h4 className="font-bebas text-captain-bright text-xl tracking-wider">{table.label}</h4>
                      <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Dine-in Order URL</span>
                    </div>
                    <span className={`h-2.5 w-2.5 rounded-full ${table.isOccupied ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-green-500"}`} />
                  </div>

                  {/* QR code canvas card */}
                  <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center">
                    <QRCodeCanvas
                      id={`qr-canvas-${table.tableNumber}`}
                      value={qrUrl}
                      size={160}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"H"}
                      includeMargin={false}
                      imageSettings={{
                        src: `${window.location.origin}/logo.svg`,
                        x: null,
                        y: null,
                        height: 28,
                        width: 28,
                        excavate: true
                      }}
                    />
                    <div className="mt-2 text-center text-black font-nav text-[10px] font-extrabold uppercase tracking-[0.14em]">
                      TABLE {table.tableNumber}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="w-full grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                    <button
                      type="button"
                      onClick={() => downloadQRCode(table.tableNumber, table.label)}
                      className="inline-flex justify-center items-center p-2 rounded-lg bg-white/5 border border-white/10 hover:border-captain-gold hover:text-captain-bright text-white/70 transition"
                      title="Download QR Code Image"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(table)}
                      className="inline-flex justify-center items-center p-2 rounded-lg bg-white/5 border border-white/10 hover:border-captain-gold hover:text-captain-bright text-white/70 transition"
                      title="Edit Table Info"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(table.id)}
                      className="inline-flex justify-center items-center p-2 rounded-lg bg-white/5 border border-white/10 hover:border-red-500 hover:text-red-400 text-white/70 transition"
                      title="Delete Table"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* A4 PRINT CONTAINER (Hidden in screen view, visible only in @media print) */}
      <div className="print-only hidden">
        <div className="grid grid-cols-2 gap-x-12 gap-y-16 p-8">
          {sortedTables.map((table) => {
            const qrUrl = `${window.location.origin}/menu?table=${table.tableNumber}`;
            return (
              <div key={`print-${table.id}`} className="border-4 border-black p-8 rounded-2xl flex flex-col items-center justify-center space-y-6 text-center page-break-inside-avoid">
                <h2 className="font-bebas text-4xl text-black font-bold tracking-widest uppercase">CAPTAIN 7</h2>
                <h3 className="font-nav text-lg font-bold text-black border-y border-black/20 py-2 w-full">
                  {table.label.toUpperCase()}
                </h3>
                
                <div className="bg-white p-4 border border-black/10 rounded-xl">
                  <QRCodeCanvas
                    value={qrUrl}
                    size={220}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"H"}
                    includeMargin={false}
                    imageSettings={{
                      src: `${window.location.origin}/logo.svg`,
                      x: null,
                      y: null,
                      height: 38,
                      width: 38,
                      excavate: true
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="font-bebas text-2xl text-black tracking-wider uppercase">SCAN TO ORDER & PAY</p>
                  <p className="font-nav text-xs text-black/50 tracking-wider">No app download or account login required.</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CRUD Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Table" : "Add New Table"}>
        <form onSubmit={handleSave} className="space-y-5">
          <label className="grid gap-2">
            <span className="font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">Table Number</span>
            <input
              type="number"
              required
              value={formState.tableNumber}
              onChange={(e) => setFormState({ ...formState, tableNumber: e.target.value })}
              className="form-input text-white"
              placeholder="e.g. 1, 2, 3"
              disabled={Boolean(editId)}
            />
          </label>

          <label className="grid gap-2">
            <span className="font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">Table Label / Name</span>
            <input
              type="text"
              required
              value={formState.label}
              onChange={(e) => setFormState({ ...formState, label: e.target.value })}
              className="form-input text-white"
              placeholder="e.g. Table 1, VIP Room 1, Outdoor 4"
            />
          </label>

          <div className="flex items-center gap-3 bg-captain-black/40 border border-white/5 p-4 rounded-lg">
            <input
              type="checkbox"
              id="isOccupied"
              checked={formState.isOccupied}
              onChange={(e) => setFormState({ ...formState, isOccupied: e.target.checked })}
              className="h-4 w-4 rounded border-white/10 bg-captain-black text-captain-gold focus:ring-captain-gold"
            />
            <label htmlFor="isOccupied" className="font-nav text-xs font-extrabold uppercase tracking-wider text-white/70">
              Mark Occupied / Seated
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editId ? "Update Table" : "Save Table"}
            </Button>
          </div>
        </form>
      </Modal>

      <Toast message={toast} />

      {/* Printable styles for A4 layout */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
