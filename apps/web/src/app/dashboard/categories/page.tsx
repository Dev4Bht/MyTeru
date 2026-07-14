"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { CategoryForm } from "@/components/categories/category-form";
import { useCategories, useDeleteCategory } from "@/lib/queries/use-categories";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <DashboardNav />

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            System categories are shared and can&apos;t be edited. Add your own below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <CategoryForm onDone={() => {}} />

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <ul className="divide-y divide-border">
              {categories?.map((category) => (
                <li key={category.id} className="flex items-center justify-between py-3">
                  <span className="text-sm">
                    {category.icon ? `${category.icon} ` : ""}
                    {category.name}
                    <span className="ml-2 text-xs text-muted-foreground">({category.type})</span>
                  </span>
                  {category.isSystem ? (
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                      System
                    </span>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => deleteCategory.mutate(category.id)}>
                      Delete
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
