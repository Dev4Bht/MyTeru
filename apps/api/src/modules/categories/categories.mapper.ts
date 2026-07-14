import { CategoryDto } from "@druksave/shared";
import { Category } from "@druksave/database";

export function toCategoryDto(category: Category): CategoryDto {
  return {
    id: category.id,
    userId: category.userId,
    name: category.name,
    type: category.type,
    icon: category.icon ?? null,
    color: category.color ?? null,
    isSystem: category.isSystem,
  };
}
