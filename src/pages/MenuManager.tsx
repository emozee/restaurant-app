import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Loader2, Plus, Pencil, Trash2, X, Upload, ImageIcon } from "lucide-react";
import { useToast } from "../components/Toast";

export default function MenuManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const blankForm = { name: "", price: "", category: "", image_url: "" };
  const [form, setForm] = useState(blankForm);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const { data } = await supabase.from("menu_items").select("*").order("category").order("name");
    setItems(data || []);
    setLoading(false);
  }

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name, price: item.price, category: item.category || "", image_url: item.image_url || "" });
    setShowAddForm(false);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(blankForm);
    setShowAddForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `menu/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("menu-images").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("menu-images").getPublicUrl(fileName);
      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    } catch (err: any) {
      toast("Upload failed: " + err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast("Name and price are required", "error"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, price: parseFloat(form.price), category: form.category, image_url: form.image_url };
      if (editItem) {
        await supabase.from("menu_items").update(payload).eq("id", editItem.id);
        setItems((prev) => prev.map((i) => (i.id === editItem.id ? { ...i, ...payload } : i)));
        setEditItem(null);
      } else {
        const { data } = await supabase.from("menu_items").insert([payload]).select().single();
        if (data) setItems((prev) => [...prev, data]);
        setShowAddForm(false);
      }
      setForm(blankForm);
      toast(editItem ? "Item updated successfully" : "Item added to menu", "success");
    } catch (err: any) {
      toast("Save failed: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await supabase.from("menu_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const isFormOpen = editItem || showAddForm;

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-[#D64000]" size={40} />
    </div>
  );

  const grouped = items.reduce((acc: any, item) => {
    const cat = item.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">Menu Items</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{items.length} items - Edit prices & photos</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#D64000] text-white px-5 py-3 rounded-2xl font-black shadow-lg hover:brightness-110 transition active:scale-95"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>

        {/* ADD / EDIT FORM */}
        {isFormOpen && (
          <div className="glass-card rounded-[2rem] p-6 mb-8">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-black text-lg uppercase italic">{editItem ? "Edit Item" : "Add New Item"}</h2>
              <button onClick={() => { setEditItem(null); setShowAddForm(false); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 ml-1">Item Name *</label>
                <input
                  className="w-full p-3 bg-white/80 backdrop-blur-sm rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="e.g. Butter Chicken"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 ml-1">Price (Nu.) *</label>
                <input
                  className="w-full p-3 bg-white/80 backdrop-blur-sm rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="e.g. 150"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 ml-1">Category</label>
                <input
                  className="w-full p-3 bg-white/80 backdrop-blur-sm rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="e.g. Main Course"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 ml-1">Photo</label>
                <div className="flex gap-2 items-center">
                  <label className="flex-1 flex items-center gap-2 p-3 bg-white/80 backdrop-blur-sm rounded-2xl cursor-pointer hover:bg-white/90 transition border border-white/20">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    {uploading ? <Loader2 size={16} className="animate-spin text-orange-500" /> : <Upload size={16} className="text-gray-400" />}
                    <span className="text-sm font-bold text-gray-400">{uploading ? "Uploading..." : "Upload Photo"}</span>
                  </label>
                  {form.image_url && (
                    <img src={form.image_url} className="w-12 h-12 rounded-xl object-cover border border-gray-100" alt="preview" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#D64000] text-white p-4 rounded-2xl font-black shadow-lg disabled:opacity-50 active:scale-95 transition"
              >
                {saving ? <Loader2 className="animate-spin mx-auto" size={20} /> : editItem ? "Save Changes" : "Add to Menu"}
              </button>
              <button
                onClick={() => { setEditItem(null); setShowAddForm(false); }}
                className="px-6 bg-gray-100 text-gray-600 p-4 rounded-2xl font-black"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ITEMS BY CATEGORY */}
        {Object.entries(grouped).map(([cat, catItems]: [string, any]) => (
          <div key={cat} className="mb-8">
            <h2 className="text-xs font-black uppercase text-gray-300 tracking-widest mb-4">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {catItems.map((item: any) => (
                <div key={item.id} className="glass-card rounded-[2rem] overflow-hidden flex items-center gap-4 p-4 hover-lift">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden shrink-0">
                    {item.image_url
                      ? <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                      : <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={24} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 truncate">{item.name}</p>
                    <p className="text-[#D64000] font-black text-sm">Nu. {item.price}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 bg-orange-50 text-orange-500 rounded-xl hover:bg-orange-100 transition"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && !isFormOpen && (
          <div className="text-center py-24 text-gray-300">
            <ImageIcon size={64} className="mx-auto mb-4" />
            <p className="font-black text-xl">No menu items yet</p>
            <p className="text-sm mt-2">Click "Add Item" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
