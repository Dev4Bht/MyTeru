"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "@/components/categories/category-form";
import { useCategories, useDeleteCategory } from "@/lib/queries/use-categories";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Categories</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add a category</CardTitle>
          <CardDescription>System categories are shared and can&apos;t be edited.</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm onDone={() => {}} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All categories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <ul className="divide-y divide-border">
              {categories?.map((category) => (
                <li key={category.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg",
                        category.type === "INCOME" ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {category.icon || (category.type === "INCOME" ? "↓" : "↑")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{category.name}</span>
                      <span className="block text-xs capitalize text-muted-foreground">
                        {category.type.toLowerCase()}
                      </span>
                    </span>
                  </span>
                  {category.isSystem ? (
                    <Badge variant="outline">System</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete category"
                      className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteCategory.mutate(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
