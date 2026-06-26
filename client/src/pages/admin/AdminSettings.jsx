import { useState, useEffect, useMemo } from "react";
import { 
  Settings, 
  Image, 
  Key, 
  MessageSquare, 
  Building, 
  Sliders, 
  UploadCloud, 
  Download, 
  Loader2, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase.js";
import { useSettingDoc } from "../../hooks/useSettings.js";
import { uploadToImgBB } from "../../hooks/useAdminCollection.js";
import { compressImage } from "../../utils/compressImage.js";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Toast } from "../../components/ui/Toast.jsx";

const TABS = [
  { id: "hero", label: "Hero Images", icon: Image },
  { id: "compressor", label: "Image Compressor", icon: Sliders },
  { id: "apikeys", label: "API Keys", icon: Key },
  { id: "whatsapp", label: "WhatsApp Settings", icon: MessageSquare },
  { id: "business", label: "Business Info", icon: Building }
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("hero");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Load settings docs from Firestore
  const { data: heroImages, loading: loadingHero } = useSettingDoc("heroImages", {});
  const { data: apiKeys, loading: loadingApi } = useSettingDoc("apiKeys", {});
  const { data: whatsapp, loading: loadingWA } = useSettingDoc("whatsapp", {});
  const { data: business, loading: loadingBiz } = useSettingDoc("business", {});

  // Form States
  const [formHeroImages, setFormHeroImages] = useState({});
  const [formApiKeys, setFormApiKeys] = useState({});
  const [formWhatsapp, setFormWhatsapp] = useState({});
  const [formBusiness, setFormBusiness] = useState({});

  useEffect(() => {
    if (heroImages) setFormHeroImages(heroImages);
  }, [heroImages]);

  useEffect(() => {
    if (apiKeys) setFormApiKeys(apiKeys);
  }, [apiKeys]);

  useEffect(() => {
    if (whatsapp) setFormWhatsapp(whatsapp);
  }, [whatsapp]);

  useEffect(() => {
    if (business) setFormBusiness(business);
  }, [business]);

  // Image Compressor States
  const [compFile, setCompFile] = useState(null);
  const [compTargetKB, setCompTargetKB] = useState(200);
  const [compResult, setCompResult] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [origPreview, setOrigPreview] = useState("");
  const [compPreview, setCompPreview] = useState("");

  // Handle compressor target size change
  const handleCompress = async (file, sizeKB) => {
    if (!file) return;
    setCompressing(true);
    try {
      const res = await compressImage(file, sizeKB);
      setCompResult(res);
      
      // Generate preview for compressed blob
      if (compPreview) URL.revokeObjectURL(compPreview);
      setCompPreview(URL.createObjectURL(res.file));
    } catch (err) {
      console.error(err);
      showToast("Compression failed");
    } finally {
      setCompressing(false);
    }
  };

  const handleCompFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompFile(file);
    
    if (origPreview) URL.revokeObjectURL(origPreview);
    setOrigPreview(URL.createObjectURL(file));

    handleCompress(file, compTargetKB);
  };

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setCompTargetKB(val);
    if (compFile) {
      handleCompress(compFile, val);
    }
  };

  const handleDownloadCompressed = () => {
    if (!compResult?.file) return;
    const url = URL.createObjectURL(compResult.file);
    const a = document.createElement("a");
    a.href = url;
    a.download = compResult.file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Hero image upload
  const [uploadingPage, setUploadingPage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleHeroImageChange = async (pageKey, file) => {
    if (!file) return;
    setUploadingPage(pageKey);
    setUploadProgress(10);
    try {
      const key = formApiKeys.imgbbApiKey || apiKeys.imgbbApiKey;
      const url = await uploadToImgBB(file, (p) => setUploadProgress(p), key);
      
      const updatedHeroes = { ...formHeroImages, [pageKey]: url };
      setFormHeroImages(updatedHeroes);
      
      // Save immediately
      await setDoc(doc(db, "settings", "heroImages"), updatedHeroes);
      showToast(`Hero image for ${pageKey} updated!`);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Upload failed. Verify ImgBB key.");
    } finally {
      setUploadingPage("");
      setUploadProgress(0);
    }
  };

  // Generic submit section
  const handleSaveSection = async (docId, data) => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", docId), data, { merge: true });
      showToast(`${docId.toUpperCase()} settings saved!`);
    } catch (err) {
      console.error(err);
      showToast("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const isLoading = loadingHero || loadingApi || loadingWA || loadingBiz;

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-captain-gold mb-3" size={28} />
        <p className="text-sm text-white/50">Loading settings database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-5xl text-white">SYSTEM SETTINGS</h1>
          <p className="mt-2 text-sm text-white/55">Configure API credentials, WhatsApp templates, business details, and home slide assets.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-captain-gold text-captain-black shadow-gold"
                    : "text-white/60 hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Workpanel */}
        <div className="space-y-6">
          {/* Tab 1: Hero Images */}
          {activeTab === "hero" && (
            <Card hover={false} className="p-6 space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-bold text-white mb-2">Hero Images</h3>
                <p className="text-sm text-white/50">Configure background banner images for public customer-facing screens.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {["home", "cricketBooking", "foodMenu", "gallery", "partyPackages", "contact"].map((page) => (
                  <div key={page} className="rounded-lg border border-white/10 bg-captain-black/40 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-nav text-xs font-extrabold uppercase tracking-wider text-captain-gold capitalize">
                        {page.replace(/([A-Z])/g, " $1")} Page
                      </span>
                      {uploadingPage === page && (
                        <span className="text-[10px] text-captain-bright animate-pulse">Uploading {uploadProgress}%</span>
                      )}
                    </div>

                    <div className="aspect-[21/9] w-full overflow-hidden rounded bg-captain-black/80 border border-white/5 relative">
                      {formHeroImages[page] ? (
                        <img src={formHeroImages[page]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white/20 text-xs">No image configured</div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="form-input flex-1 text-xs"
                        placeholder="Image URL"
                        value={formHeroImages[page] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormHeroImages(h => ({ ...h, [page]: val }));
                        }}
                      />
                      <label className="relative cursor-pointer rounded bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-white transition flex items-center justify-center shrink-0">
                        <UploadCloud size={14} />
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uploadingPage !== ""}
                          onChange={(e) => handleHeroImageChange(page, e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <Button onClick={() => handleSaveSection("heroImages", formHeroImages)} disabled={saving}>
                  {saving ? "Saving..." : "Save Hero Images"}
                </Button>
              </div>
            </Card>
          )}

          {/* Tab 2: Image Compressor */}
          {activeTab === "compressor" && (
            <Card hover={false} className="p-6 space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-bold text-white mb-2">Image Compressor Tool</h3>
                <p className="text-sm text-white/50">Compress banners or gallery photos locally to target size constraints before uploads.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1 space-y-4">
                  <div className="rounded-lg border border-dashed border-white/20 bg-captain-black/40 p-6 text-center">
                    <UploadCloud className="mx-auto text-white/30 mb-3" size={32} />
                    <label className="relative cursor-pointer rounded-full bg-captain-gold hover:bg-captain-gold-hover px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-captain-black transition inline-block">
                      Select Image
                      <input type="file" accept="image/*" className="sr-only" onChange={handleCompFileChange} />
                    </label>
                    <p className="text-[10px] text-white/40 mt-2">JPEG/PNG formatted files supported</p>
                  </div>

                  <div>
                    <label className="mb-2 flex justify-between text-xs text-white/60 select-none">
                      <span>Target File Size Limit:</span>
                      <span className="font-bold text-captain-bright">{compTargetKB} KB</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="500"
                      step="25"
                      value={compTargetKB}
                      onChange={handleSliderChange}
                      className="w-full accent-captain-gold bg-white/10 rounded h-1 cursor-pointer"
                    />
                  </div>

                  {compResult && (
                    <div className="rounded bg-white/5 p-3 space-y-1.5 text-xs text-white/70 font-mono">
                      <div>Orig Size: {(compResult.originalSize / 1024).toFixed(1)} KB</div>
                      <div>Comp Size: {(compResult.compressedSize / 1024).toFixed(1)} KB</div>
                      <div className="text-emerald-400 font-bold">Ratio: {compResult.compressionRatio}% Shaved</div>
                    </div>
                  )}

                  {compResult && (
                    <Button onClick={handleDownloadCompressed} icon={Download} className="w-full">
                      Download Compressed
                    </Button>
                  )}
                </div>

                <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Original Image</span>
                    <div className="aspect-[4/3] w-full rounded border border-white/10 bg-captain-black overflow-hidden relative">
                      {origPreview ? (
                        <img src={origPreview} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white/20 text-xs">No image loaded</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-white/50 uppercase tracking-wider font-semibold flex items-center gap-1">
                      Compressed Preview
                      {compressing && <Loader2 className="animate-spin text-captain-gold" size={12} />}
                    </span>
                    <div className="aspect-[4/3] w-full rounded border border-white/10 bg-captain-black overflow-hidden relative">
                      {compPreview ? (
                        <img src={compPreview} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white/20 text-xs">No compression output</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Tab 3: API Keys */}
          {activeTab === "apikeys" && (
            <Card hover={false} className="p-6 space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-bold text-white mb-2">API Keys & Third-party Credentials</h3>
                <p className="text-sm text-white/50">Manage Razorpay, ImgBB, and Google Maps API credential tokens.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveSection("apiKeys", formApiKeys);
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-white/55">ImgBB API Key</label>
                    <input
                      type="password"
                      className="form-input w-full font-mono text-xs"
                      placeholder="ImgBB upload token key"
                      value={formApiKeys.imgbbApiKey || ""}
                      onChange={(e) => setFormApiKeys(k => ({ ...k, imgbbApiKey: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/55">Google Review URL</label>
                    <input
                      type="url"
                      className="form-input w-full text-xs"
                      placeholder="https://g.page/r/your-review-url"
                      value={formApiKeys.googleReviewUrl || ""}
                      onChange={(e) => setFormApiKeys(k => ({ ...k, googleReviewUrl: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-white/55">Razorpay Key ID</label>
                    <input
                      type="text"
                      className="form-input w-full font-mono text-xs"
                      placeholder="rzp_live_xxxxxxxx"
                      value={formApiKeys.razorpayKeyId || ""}
                      onChange={(e) => setFormApiKeys(k => ({ ...k, razorpayKeyId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/55">Razorpay Key Secret</label>
                    <input
                      type="password"
                      className="form-input w-full font-mono text-xs"
                      placeholder="Razorpay Secret token key"
                      value={formApiKeys.razorpayKeySecret || ""}
                      onChange={(e) => setFormApiKeys(k => ({ ...k, razorpayKeySecret: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/55">Google Maps API Key</label>
                  <input
                    type="password"
                    className="form-input w-full font-mono text-xs"
                    placeholder="Google Maps Geocoding API key"
                    value={formApiKeys.googleMapsApiKey || ""}
                    onChange={(e) => setFormApiKeys(k => ({ ...k, googleMapsApiKey: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Credentials"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Tab 4: WhatsApp Settings */}
          {activeTab === "whatsapp" && (
            <Card hover={false} className="p-6 space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-bold text-white mb-2">WhatsApp Notification Templates</h3>
                <p className="text-sm text-white/50">Manage recipient numbers and dynamic order dispatch formats.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveSection("whatsapp", formWhatsapp);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-xs text-white/55">Owner WhatsApp Number</label>
                  <input
                    type="tel"
                    className="form-input w-full text-xs"
                    placeholder="919000469552"
                    value={formWhatsapp.ownerNumber || ""}
                    onChange={(e) => setFormWhatsapp(w => ({ ...w, ownerNumber: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/55">New Order Message Template</label>
                  <textarea
                    rows={4}
                    className="form-input w-full font-mono text-xs"
                    placeholder="e.g. New Order alert: {orderId}"
                    value={formWhatsapp.newOrderTemplate || ""}
                    onChange={(e) => setFormWhatsapp(w => ({ ...w, newOrderTemplate: e.target.value }))}
                  />
                  <div className="text-[10px] text-white/35 mt-1">Available tags: {`{orderId}, {customerName}, {customerPhone}, {address}, {items}, {total}`}</div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/55">Delivered Receipt Message Template</label>
                  <textarea
                    rows={6}
                    className="form-input w-full font-mono text-xs"
                    placeholder="e.g. Receipt for #{orderId}"
                    value={formWhatsapp.deliveredReceiptTemplate || ""}
                    onChange={(e) => setFormWhatsapp(w => ({ ...w, deliveredReceiptTemplate: e.target.value }))}
                  />
                  <div className="text-[10px] text-white/35 mt-1">Available tags: {`{orderId}, {items}, {subtotal}, {gst}, {total}, {workerName}`}</div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Templates"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Tab 5: Business Info */}
          {activeTab === "business" && (
            <Card hover={false} className="p-6 space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-bold text-white mb-2">Business Information</h3>
                <p className="text-sm text-white/50">Manage FSSAI license, phone details, addresses, and maps embeds.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveSection("business", formBusiness);
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-white/55">Business Name</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={formBusiness.name || ""}
                      onChange={(e) => setFormBusiness(b => ({ ...b, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/55">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input w-full"
                      value={formBusiness.phone || ""}
                      onChange={(e) => setFormBusiness(b => ({ ...b, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-white/55">FSSAI License Number</label>
                    <input
                      type="text"
                      className="form-input w-full font-mono"
                      placeholder="e.g. 10123022000035"
                      value={formBusiness.fssai || ""}
                      onChange={(e) => setFormBusiness(b => ({ ...b, fssai: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/55">Google Place ID</label>
                    <input
                      type="text"
                      className="form-input w-full font-mono text-xs"
                      placeholder="Google Place Reference code"
                      value={formBusiness.placeId || ""}
                      onChange={(e) => setFormBusiness(b => ({ ...b, placeId: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/55">Physical Street Address</label>
                  <textarea
                    rows={2}
                    className="form-input w-full text-xs"
                    value={formBusiness.address || ""}
                    onChange={(e) => setFormBusiness(b => ({ ...b, address: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/55">Google Maps Embed URL</label>
                  <input
                    type="url"
                    className="form-input w-full text-xs"
                    placeholder="https://maps.google.com/maps?q=..."
                    value={formBusiness.mapsEmbed || ""}
                    onChange={(e) => setFormBusiness(b => ({ ...b, mapsEmbed: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Business Info"}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>

      <Toast message={toast} tone="green" />
    </div>
  );
}
export { AdminSettings };
