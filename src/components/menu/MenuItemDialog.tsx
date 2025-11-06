import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { MenuItem } from "@/pages/MenuManagement";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0, "Preço deve ser positivo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  is_featured: z.boolean().default(false),
  is_available: z.boolean().default(true),
});

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: MenuItem | null;
  onSave: () => void;
  categories: string[];
}

export function MenuItemDialog({
  open,
  onOpenChange,
  editingItem,
  onSave,
  categories,
}: MenuItemDialogProps) {
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      is_featured: false,
      is_available: true,
    },
  });

  useEffect(() => {
    if (editingItem) {
      form.reset({
        name: editingItem.name,
        description: editingItem.description || "",
        price: editingItem.price,
        category: editingItem.category,
        is_featured: editingItem.is_featured,
        is_available: editingItem.is_available,
      });
      setImagePreview(editingItem.image_url);
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        category: "",
        is_featured: false,
        is_available: true,
      });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [editingItem, form, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem deve ter no máximo 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from("menu-images")
      .upload(fileName, imageFile);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("menu-images").getPublicUrl(fileName);

    return publicUrl;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    setUploading(true);
    try {
      // Check for duplicate names
      const { data: existingItems, error: checkError } = await supabase
        .from("menu_items")
        .select("id, name")
        .eq("user_id", user.id)
        .ilike("name", values.name);

      if (checkError) throw checkError;

      // If editing, exclude the current item from duplicate check
      const hasDuplicate = editingItem
        ? existingItems?.some((item) => item.id !== editingItem.id && item.name.toLowerCase() === values.name.toLowerCase())
        : existingItems?.some((item) => item.name.toLowerCase() === values.name.toLowerCase());

      if (hasDuplicate) {
        toast.error("Já existe um produto com este nome");
        form.setError("name", {
          type: "manual",
          message: "Já existe um produto com este nome",
        });
        setUploading(false);
        return;
      }

      let imageUrl = editingItem?.image_url || null;

      // Upload new image if selected
      if (imageFile) {
        // Delete old image if exists
        if (editingItem?.image_url) {
          const oldImagePath = editingItem.image_url.split("/").pop();
          if (oldImagePath) {
            await supabase.storage.from("menu-images").remove([oldImagePath]);
          }
        }
        imageUrl = await uploadImage();
      }

      const itemData = {
        name: values.name,
        description: values.description || null,
        price: values.price,
        category: values.category,
        is_featured: values.is_featured,
        is_available: values.is_available,
        image_url: imageUrl,
        user_id: user.id,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("menu_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Item atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("menu_items").insert([itemData]);

        if (error) throw error;
        toast.success("Item adicionado com sucesso!");
      }

      onSave();
    } catch (error: any) {
      toast.error("Erro ao salvar item");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Editar Item" : "Adicionar Novo Item"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <FormLabel>Imagem do Prato</FormLabel>
              <div className="flex flex-col gap-4">
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Tamanho máximo: 5MB. Formatos: JPG, PNG, WEBP
                </p>
              </div>
            </div>

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Item *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Risoto de Camarão" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os ingredientes e características do prato..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price and Category */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Switches */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Item em Destaque
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Destacar este item no cardápio
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_available"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Disponível</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Item disponível para pedidos
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? "Salvar Alterações" : "Adicionar Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
