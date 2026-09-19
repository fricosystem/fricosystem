import { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FilterDropdown from './FilterDropdown';

export interface Post {
  title: string;
  category: string;
  subcategory?: string;
  date: string;
  excerpt: string;
  image: string;
  slug: string;
  tags?: string[];
}

interface PageFilterProps {
  posts: Post[];
  onFilteredPostsChange: (posts: Post[]) => void;
  availableCategories?: string[];
  showCategoryFilter?: boolean;
}

const PageFilter = ({ 
  posts, 
  onFilteredPostsChange, 
  availableCategories = [],
  showCategoryFilter = false 
}: PageFilterProps) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Get available subcategories based on selected category
  const availableSubcategories = useMemo(() => {
    const subcategories = new Set<string>();
    posts.forEach(post => {
      if (post.subcategory && (!selectedCategory || post.category === selectedCategory)) {
        subcategories.add(post.subcategory);
      }
    });
    return Array.from(subcategories).sort();
  }, [posts, selectedCategory]);

  // Get available tags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [posts]);

  // Filter posts based on selected filters
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (selectedCategory && post.category !== selectedCategory) return false;
      if (selectedSubcategory && post.subcategory !== selectedSubcategory) return false;
      if (selectedTag && (!post.tags || !post.tags.includes(selectedTag))) return false;
      return true;
    });
  }, [posts, selectedCategory, selectedSubcategory, selectedTag]);

  // Update parent component when filtered posts change
  useEffect(() => {
    onFilteredPostsChange(filteredPosts);
  }, [filteredPosts, onFilteredPostsChange]);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedTag('');
  };

  const hasActiveFilters = selectedCategory || selectedSubcategory || selectedTag;

  // Create filter options with counts
  const categoryOptions = availableCategories.map(category => ({
    value: category,
    label: category,
    count: posts.filter(post => post.category === category).length
  }));

  const subcategoryOptions = availableSubcategories.map(subcategory => ({
    value: subcategory,
    label: subcategory,
    count: posts.filter(post => 
      post.subcategory === subcategory && 
      (!selectedCategory || post.category === selectedCategory)
    ).length
  }));

  const tagOptions = availableTags.map(tag => ({
    value: tag,
    label: tag,
    count: posts.filter(post => post.tags?.includes(tag)).length
  }));

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex flex-wrap gap-3 flex-1">
          {showCategoryFilter && categoryOptions.length > 0 && (
            <FilterDropdown
              title="Category"
              options={categoryOptions}
              selectedValue={selectedCategory}
              onSelect={setSelectedCategory}
              placeholder="All Categories"
            />
          )}
          
          {subcategoryOptions.length > 0 && (
            <FilterDropdown
              title="Subcategory"
              options={subcategoryOptions}
              selectedValue={selectedSubcategory}
              onSelect={setSelectedSubcategory}
              placeholder="All Topics"
            />
          )}

          {tagOptions.length > 0 && (
            <FilterDropdown
              title="Tag"
              options={tagOptions}
              selectedValue={selectedTag}
              onSelect={setSelectedTag}
              placeholder="All Tags"
            />
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {filteredPosts.length} of {posts.length} posts
            {selectedCategory && ` in ${selectedCategory}`}
            {selectedSubcategory && ` • ${selectedSubcategory}`}
            {selectedTag && ` • Tagged: ${selectedTag}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default PageFilter;