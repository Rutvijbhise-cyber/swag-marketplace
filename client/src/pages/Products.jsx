import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [addingToCart, setAddingToCart] = useState(null);
  const { addToCart } = useCart();

  const page = parseInt(searchParams.get('page')) || 1;
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'name';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page,
          limit: 20,
          sortBy
        });

        if (category && category !== 'all') {
          params.append('category', category);
        }
        if (search) {
          params.append('search', search);
        }

        const [itemsData, categoriesData] = await Promise.all([
          api.get(`/items?${params}`),
          api.get('/items/categories')
        ]);

        setItems(itemsData.items);
        setPagination(itemsData.pagination);
        setCategories(categoriesData.categories);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, category, search, sortBy]);

  const handleCategoryChange = (newCategory) => {
    setSearchParams((prev) => {
      prev.set('category', newCategory);
      prev.set('page', '1');
      return prev;
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const searchValue = formData.get('search');
    setSearchParams((prev) => {
      if (searchValue) {
        prev.set('search', searchValue);
      } else {
        prev.delete('search');
      }
      prev.set('page', '1');
      return prev;
    });
  };

  const handleSort = (e) => {
    setSearchParams((prev) => {
      prev.set('sortBy', e.target.value);
      return prev;
    });
  };

  const handleAddToCart = async (itemId) => {
    setAddingToCart(itemId);
    try {
      await addToCart(itemId, 1);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAddingToCart(null);
    }
  };

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      prev.set('page', newPage.toString());
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Company Swag</h1>
        <p className="page-subtitle">Browse our collection of {pagination.total || 0} items</p>
      </div>

      <div className="filters">
        <form onSubmit={handleSearch} className="filter-group search-input">
          <input
            type="text"
            name="search"
            className="form-input"
            placeholder="Search products..."
            defaultValue={search}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>

        <div className="filter-group">
          <label>Sort by:</label>
          <select className="filter-select" value={sortBy} onChange={handleSort}>
            <option value="name">Name</option>
            <option value="price">Price: Low to High</option>
            <option value="createdAt">Newest</option>
          </select>
        </div>
      </div>

      <div className="category-pills">
        <button
          className={`category-pill ${category === 'all' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('all')}
        >
          All ({categories.reduce((sum, c) => sum + c.count, 0)})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.name}
            className={`category-pill ${category === cat.name ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.name)}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <button
            className="btn btn-primary"
            onClick={() => setSearchParams({})}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {items.map((item) => (
              <div key={item.id} className="card product-card">
                <Link to={`/products/${item.id}`} className="product-image">
                  <img src={item.imageUrl} alt={item.name} loading="lazy" />
                </Link>
                <div className="product-info">
                  <span className="product-category">{item.category}</span>
                  <Link to={`/products/${item.id}`}>
                    <h3 className="product-name">{item.name}</h3>
                  </Link>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span className="product-price">${item.price.toFixed(2)}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddToCart(item.id)}
                      disabled={addingToCart === item.id || item.stock === 0}
                    >
                      {addingToCart === item.id ? '...' : item.stock === 0 ? 'Out of Stock' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
