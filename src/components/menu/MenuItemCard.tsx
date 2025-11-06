import { MenuItem } from "@/pages/MenuManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Star } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string, imageUrl: string | null) => void;
  onToggleAvailability: (id: string, currentStatus: boolean) => void;
}

export function MenuItemCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}: MenuItemCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Sem imagem
          </div>
        )}
        {item.is_featured && (
          <Badge className="absolute top-2 right-2 bg-yellow-500">
            <Star className="h-3 w-3 mr-1" />
            Destaque
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-2">
        {/* Category Badge */}
        <Badge variant="secondary">{item.category}</Badge>

        {/* Name and Price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
          <span className="font-bold text-primary whitespace-nowrap">
            R$ {item.price.toFixed(2)}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Availability */}
        <div className="flex items-center gap-2 pt-2">
          <Switch
            checked={item.is_available}
            onCheckedChange={() =>
              onToggleAvailability(item.id, item.is_available)
            }
          />
          <span className="text-sm">
            {item.is_available ? "Disponível" : "Indisponível"}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={() => onDelete(item.id, item.image_url)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </CardFooter>
    </Card>
  );
}
