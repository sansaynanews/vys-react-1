"use client";

import { useState, useEffect, useCallback } from "react";
import { Phone, Search, FileDown, Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/hooks/useToastStore";

interface Rehber {
  id: number;
  ad_soyad: string;
  unvan: string | null;
  kurum: string | null;
  telefon: string;
  telefon2: string | null;
  dahili: string | null;
  email: string | null;
  adres: string | null;
  aciklama: string | null;
  created_at: string;
}

export default function RehberPage() {
  const { showToast } = useToastStore();

  // State
  const [rehberList, setRehberList] = useState<Rehber[]>([]);
  const [kurumList, setKurumList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 20;

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKurum, setSelectedKurum] = useState("Tümü");

  // Form
  const [formData, setFormData] = useState({
    id: null as number | null,
    ad_soyad: "",
    unvan: "",
    kurum: "",
    telefon: "",
    telefon2: "",
    dahili: "",
    email: "",
    adres: "",
    aciklama: "",
  });

  // Fetch Data
  const fetchRehber = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        islem: "liste",
        page: page.toString(),
        limit: limit.toString(),
        search: searchTerm,
        kurum: selectedKurum,
      });

      const res = await fetch(`/api/rehber?${params}`);
      const data = await res.json();

      if (data.status === "success") {
        setRehberList(data.data);
        setTotalRecords(data.total);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showToast("Veri yüklenirken hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedKurum, showToast]);

  // Fetch Kurum List
  const fetchKurumList = async () => {
    try {
      const res = await fetch("/api/rehber?islem=kurum_listesi");
      const data = await res.json();
      setKurumList(data);
    } catch (error) {
      console.error("Kurum list error:", error);
    }
  };

  useEffect(() => {
    fetchRehber();
    fetchKurumList();
  }, [fetchRehber]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRehber(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedKurum]);

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ad_soyad || !formData.telefon) {
      showToast("Ad Soyad ve Telefon alanları zorunludur", "error");
      return;
    }

    try {
      const res = await fetch("/api/rehber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result.status === "success") {
        showToast(formData.id ? "Kayıt güncellendi" : "Kayıt eklendi", "success");
        setFormOpen(false);
        resetForm();
        fetchRehber(currentPage);
        fetchKurumList();
      } else {
        showToast("İşlem başarısız", "error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      showToast("İşlem sırasında hata oluştu", "error");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const res = await fetch(`/api/rehber?id=${selectedId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (result.status === "success") {
        showToast("Kayıt silindi", "info");
        fetchRehber(currentPage);
        fetchKurumList();
      } else {
        showToast("Silme işlemi başarısız", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Silme işlemi başarısız", "error");
    }
  };

  // Helpers
  const resetForm = () => {
    setFormData({
      id: null,
      ad_soyad: "",
      unvan: "",
      kurum: "",
      telefon: "",
      telefon2: "",
      dahili: "",
      email: "",
      adres: "",
      aciklama: "",
    });
  };

  const openEditModal = (rehber: Rehber) => {
    // Telefon 0 ile başlıyorsa kaldır
    const tel = rehber.telefon && rehber.telefon.startsWith("0")
      ? rehber.telefon.slice(1)
      : rehber.telefon || "";
    const tel2 = rehber.telefon2 && rehber.telefon2.startsWith("0")
      ? rehber.telefon2.slice(1)
      : rehber.telefon2 || "";

    setFormData({
      id: rehber.id,
      ad_soyad: rehber.ad_soyad || "",
      unvan: rehber.unvan || "",
      kurum: rehber.kurum || "",
      telefon: tel,
      telefon2: tel2,
      dahili: rehber.dahili || "",
      email: rehber.email || "",
      adres: rehber.adres || "",
      aciklama: rehber.aciklama || "",
    });
    setFormOpen(true);
  };

  const openDeleteModal = (id: number) => {
    setSelectedId(id);
    setDeleteModalOpen(true);
  };

  // Export Excel
  const exportExcel = async () => {
    try {
      const res = await fetch("/api/rehber?islem=liste&page=1&limit=10000");
      const result = await res.json();

      if (result.status === "success" && result.data.length > 0) {
        const header = ["Ad Soyad", "Unvan", "Kurum", "Telefon", "Telefon 2", "Dahili", "Email", "Adres", "Açıklama"];
        const rows = result.data.map((r: Rehber) => [
          r.ad_soyad || "",
          r.unvan || "",
          r.kurum || "",
          r.telefon || "",
          r.telefon2 || "",
          r.dahili || "",
          r.email || "",
          r.adres || "",
          r.aciklama || "",
        ]);

        const csv = "\uFEFF" + [header.join(";"), ...rows.map((row: string[]) => row.join(";"))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `Rehber_Listesi_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("Excel dosyası indirildi", "success");
      } else {
        showToast("Aktarılacak kayıt yok", "info");
      }
    } catch (error) {
      showToast("Excel oluşturulamadı", "error");
    }
  };

  // Normalize Phone
  const normalizePhone = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    return cleaned.startsWith("0") ? cleaned : "0" + cleaned;
  };

  const handleFormChange = (field: string, value: string) => {
    if (field === "telefon" || field === "telefon2") {
      const cleaned = value.replace(/[^0-9]/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, [field]: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <Phone className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Telefon Rehberi</h1>
            <p className="text-blue-100 text-sm">Toplam {totalRecords} kayıt</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Form */}
        <div className="xl:col-span-5">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Rehber Kayıt Formu
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Ad Soyad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ad_soyad}
                    onChange={(e) => handleFormChange("ad_soyad", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    placeholder="Ad Soyad"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Unvan
                  </label>
                  <input
                    type="text"
                    value={formData.unvan}
                    onChange={(e) => handleFormChange("unvan", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    placeholder="Unvan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Kurum
                </label>
                <input
                  type="text"
                  value={formData.kurum}
                  onChange={(e) => handleFormChange("kurum", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  placeholder="Kurum Adı"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <span className="px-3 py-2 bg-slate-50 text-slate-600 font-semibold text-sm border-r border-slate-200">
                      0
                    </span>
                    <input
                      type="tel"
                      value={formData.telefon}
                      onChange={(e) => handleFormChange("telefon", e.target.value)}
                      maxLength={10}
                      className="flex-1 px-3 py-2 outline-none"
                      placeholder="5XXXXXXXXX"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    İkinci Telefon
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <span className="px-3 py-2 bg-slate-50 text-slate-600 font-semibold text-sm border-r border-slate-200">
                      0
                    </span>
                    <input
                      type="tel"
                      value={formData.telefon2}
                      onChange={(e) => handleFormChange("telefon2", e.target.value)}
                      maxLength={10}
                      className="flex-1 px-3 py-2 outline-none"
                      placeholder="5XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Dahili No
                  </label>
                  <input
                    type="text"
                    value={formData.dahili}
                    onChange={(e) => handleFormChange("dahili", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    placeholder="Dahili"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    placeholder="ornek@mail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Adres
                </label>
                <textarea
                  value={formData.adres}
                  onChange={(e) => handleFormChange("adres", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  placeholder="Adres bilgisi..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.aciklama}
                  onChange={(e) => handleFormChange("aciklama", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  placeholder="Ek açıklamalar..."
                />
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
                {formData.id && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition"
                  >
                    İptal
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  {formData.id ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="xl:col-span-7">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {/* List Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-800">Rehber Listesi</h2>
                <Badge variant="info">{totalRecords} kayıt</Badge>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={selectedKurum}
                  onChange={(e) => setSelectedKurum(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                >
                  <option value="Tümü">Tüm Kurumlar</option>
                  {kurumList.map((kurum) => (
                    <option key={kurum} value={kurum}>
                      {kurum}
                    </option>
                  ))}
                </select>

                <div className="relative flex-1 md:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    placeholder="Ara..."
                  />
                </div>

                <button
                  onClick={exportExcel}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-12 text-slate-400">Yükleniyor...</div>
              ) : rehberList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Kayıt bulunamadı</div>
              ) : (
                <div className="space-y-2">
                  {rehberList.map((rehber) => (
                    <div
                      key={rehber.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition group"
                    >
                      {/* Kurum */}
                      <div className="flex-shrink-0 w-28">
                        <Badge variant="info" className="text-xs truncate w-full justify-center">
                          {rehber.kurum || "-"}
                        </Badge>
                      </div>

                      <div className="w-px h-8 bg-slate-200" />

                      {/* Ad Soyad & Unvan */}
                      <div className="flex-shrink-0 w-40">
                        <div className="font-semibold text-sm text-slate-800 truncate">
                          {rehber.ad_soyad}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {rehber.unvan || "-"}
                        </div>
                      </div>

                      {/* Telefon */}
                      <div className="flex-shrink-0 w-28 text-sm text-slate-600">
                        {rehber.telefon ? (
                          <a href={`tel:${rehber.telefon}`} className="hover:text-blue-600 font-medium">
                            {rehber.telefon}
                          </a>
                        ) : (
                          "-"
                        )}
                      </div>

                      {/* Telefon 2 */}
                      <div className="flex-shrink-0 w-28 text-sm text-slate-500">
                        {rehber.telefon2 ? (
                          <a href={`tel:${rehber.telefon2}`} className="hover:text-blue-600">
                            {rehber.telefon2}
                          </a>
                        ) : (
                          "-"
                        )}
                      </div>

                      {/* Dahili */}
                      <div className="flex-shrink-0 w-16 text-sm text-slate-500 text-center">
                        {rehber.dahili || "-"}
                      </div>

                      {/* Email */}
                      <div className="flex-1 min-w-0">
                        {rehber.email ? (
                          <a
                            href={`mailto:${rehber.email}`}
                            className="text-sm text-slate-600 hover:text-blue-600 truncate block"
                          >
                            {rehber.email}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </div>

                      <div className="w-px h-8 bg-slate-200" />

                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(rehber)}
                          className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-500 text-blue-600 hover:text-white flex items-center justify-center transition"
                          title="Düzenle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(rehber.id)}
                          className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center transition"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <div className="text-sm text-slate-500">
                  Toplam <span className="font-bold text-slate-700">{totalRecords}</span> kayıt,{" "}
                  <span className="font-bold text-slate-700">
                    {(currentPage - 1) * limit + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-bold text-slate-700">
                    {Math.min(currentPage * limit, totalRecords)}
                  </span>{" "}
                  arası gösteriliyor
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchRehber(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  <span className="text-sm font-bold text-slate-600">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => fetchRehber(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <ConfirmDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Kayıt Sil?"
        message="Bu kayıt kalıcı olarak silinecektir. Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
      />
    </div>
  );
}
