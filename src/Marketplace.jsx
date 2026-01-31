import React, { useState, useRef, useEffect } from 'react';
import { X, Menu, Bell, Settings, Search, Star, TrendingUp, Trophy, Home, FileText, Lightbulb, MoreHorizontal, MoreVertical, Heart, ThumbsDown, HeartOff, Eye, MessageSquare, Share2, Palette, Shield, Globe, Gift, DollarSign, Users, Monitor, BookOpen, History, Scissors, Zap, CreditCard, Crown, Tag, User, Folder, Shuffle, Camera, Pencil, ShoppingBag, Video, Sparkles, Pin, Bookmark, Info, EyeOff, Flag, Check, AlertCircle, AlertTriangle, Sun, Moon, Link2, Clock, Package, Timer } from 'lucide-react';

// CUSTOM ICON: Languages (from home.jsx)
const LanguagesCustomIcon = ({ className = '', size = 24, style = {} }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="m5 8 6 6" />
        <path d="m4 14 6-6 2-3" />
        <path d="M2 5h12" />
        <path d="M7 2h1" />
        <path d="m22 22-5-10-5 10" />
        <path d="M14 18h6" />
    </svg>
);

// CUSTOM ICON: Activity (from home.jsx)
const ActivityCustomIcon = ({ className = '', size = 24, style = {} }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
);

// CUSTOM ICON: Filled Heart (from home.jsx)
const HeartFilled = ({ className = '', size = 20, style = {} }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
        <path d="M12 21s-7.5-4.873-10-8.047C-0.1 8.98 4.12 4 8.5 6.5 10.7 7.9 12 10 12 10s1.3-2.1 3.5-3.5C19.88 4 24.1 8.98 22 12.953 19.5 16.127 12 21 12 21z" />
    </svg>
);

// Component for rendering Lucide icons by string name (copied from home.jsx)
const Icon = ({ name, size = 20, className = '', ...props }) => {
    const IconMap = {
        menu: Menu,
        bell: Bell,
        settings: Settings,
        search: Search,
        star: Star,
        chart: TrendingUp,
        cup: Trophy,
        home: Home,
        requests: FileText,
        ideas: Lightbulb,
        more: MoreHorizontal,
        moreVertical: MoreVertical,
        x: X,
        heart: Heart,
        thumbsDown: ThumbsDown,
        heartOff: HeartOff,
        heartFilled: HeartFilled,
        eye: Eye,
        message: MessageSquare,
        share: Share2,
        trendingUp: TrendingUp,
        pencil: Pencil,

        // --- Drawer Icons (Refined) ---
        profile: User,
        track: ActivityCustomIcon,
        subscriptions: CreditCard,
        referral: Gift,
        marketplace: ShoppingBag,
        bookmarks: BookOpen,
        history: History,
        editor: Scissors,
        creator: Camera,
        premium: Crown,
        language: LanguagesCustomIcon,
        theme: Palette,
        policies: Shield,
        users: Users,
        folder: Folder,
        zap: Zap,
        camera: Camera,
        crown: Crown,
        video: Video,
        sparkles: Sparkles,
        pin: Pin,
        bookmark: Bookmark,
        info: Info,
        eyeOff: EyeOff,
        flag: Flag,
        sun: Sun,
        moon: Moon,
        monitor: Monitor,
        check: Check,
        palette: Palette,
        clock: Clock,
        package: Package,
        timer: Timer,
        gift: Gift,
    };
    const Component = IconMap[name];
    if (!Component) return null;
    return <Component size={size} className={className} {...props} />;
};

const CategoryPill = ({ label, active = false, onClick = () => {} }) => (
    <button
        onClick={onClick}
        aria-pressed={active}
        className={`px-4 py-2 rounded-full border text-sm mr-2 whitespace-nowrap transition-colors duration-150 focus:outline-none ${active ? 'bg-[var(--color-gold)] text-white border-[var(--color-gold)] shadow-[0_0_10px_rgba(var(--color-gold-rgb,203,138,0),0.18)]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
    >
        {label}
    </button>
);

const ProductCard = ({ image, title, subtitle, price, tag, commission, buyUrl = '', onCopy = () => {} }) => (
    <div className="w-full md:w-1/2 lg:w-1/3 p-2">
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="relative h-48 bg-gray-50">
                <img src={image} alt={title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/800x480?text=Image+Unavailable'; }} />
                {tag && (
                    <div className="absolute top-3 left-3 bg-[var(--color-gold-cream)] text-xs font-semibold text-black px-2 py-1 rounded-md">{tag}</div>
                )}
            </div>

            <div className="p-4">
                <div className="text-sm text-gray-500">{subtitle}</div>
                <h3 className="text-lg font-semibold mt-1 mb-2" style={{...{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}}>{title}</h3>
                <div className="text-xl text-[var(--color-gold)] font-semibold mt-2">{price}</div>
                <div className="flex items-center justify-between mt-3 flex-nowrap">
                    <div className="text-xs bg-gray-100 rounded-full px-3 py-1 whitespace-nowrap">% {commission} commission</div>
                            <div className="flex flex-col sm:flex-row sm:space-x-2 gap-2 items-center">
                                <button onClick={(e) => { e.stopPropagation(); /* preserve existing handlers if any */ }} className="h-8 px-2.5 rounded-md bg-[var(--color-gold)] text-white font-semibold text-xs inline-flex items-center">
                                    <ShoppingBag size={14} className="mr-2" /> Buy
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); try { navigator.clipboard && navigator.clipboard.writeText(buyUrl || ''); } catch (err) {} onCopy(buyUrl || ''); }} className="h-8 px-2.5 rounded-md bg-white border border-gray-200 text-xs inline-flex items-center">
                                    <Link2 size={14} className="mr-2" /> Link
                                </button>
                            </div>
                </div>
            </div>
        </div>
    </div>
);

const ListProductCard = ({ p, onOpen = () => {}, onBuy = () => {} }) => (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm mb-4" onClick={() => onOpen(p)}>
        <div className="flex items-center p-4">
                <div className="w-28 flex-shrink-0 mr-4">
                            <div className="w-full h-28 rounded-lg overflow-hidden bg-gray-50">
                                <img src={p.image} alt={p.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/256?text=No+Image'; }} />
                            </div>
                            <div className="mt-2 text-[var(--color-gold)] font-semibold text-sm">{p.price}</div>
                    </div>

            <div className="flex-1 px-4">
                <div className="text-sm text-gray-500">{p.subtitle}</div>
                <h3 className="text-lg font-semibold mt-1 mb-2" style={{...{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}}>{p.title}</h3>
                {p.description && <div className="text-sm text-gray-500">{p.description}</div>}

                <div className="flex items-center mt-3 flex-nowrap">
                    <div className="text-xs bg-gray-100 rounded-full px-2 py-1 whitespace-nowrap">% {p.commission} commission</div>
                    <div className="ml-auto flex flex-col sm:flex-row sm:space-x-2 gap-2 items-center">
                        <button onClick={(e) => { e.stopPropagation(); onBuy(p); }} className="h-8 px-2.5 rounded-md bg-[var(--color-gold)] text-white font-semibold text-xs inline-flex items-center">
                            <ShoppingBag size={14} className="mr-2" /> Buy
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); try { navigator.clipboard && navigator.clipboard.writeText(p.buyUrl || ''); } catch(e) {} onCopy(p); }} className="h-8 px-2.5 rounded-md bg-white border border-gray-200 text-xs inline-flex items-center">
                            <Link2 size={14} className="mr-2" /> Link
                        </button>
                    </div>
                </div>
            </div>

            {/* price is shown under the image for better alignment on mobile */}
        </div>
        {p.tag && (
            <div className="px-4 pb-3">
                <span className="text-xs bg-gray-50 px-2 py-1 rounded-full border border-gray-200 text-gray-500">{p.tag}</span>
            </div>
        )}
    </div>
);

const NoProductsFound = ({ message = 'No products found', hint = 'Try adjusting your search or filter criteria' }) => (
    <div className="py-16 flex flex-col items-center justify-center text-center">
        <div className="w-28 h-28 rounded-lg bg-gray-50 flex items-center justify-center mb-6">
            <ShoppingBag size={44} className="text-gray-400" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">{message}</h3>
        <p className="text-sm text-gray-500 max-w-md">{hint}</p>
    </div>
);

// Add the NoProductsFound component to the appropriate place in your render logic

const SellProductsView = ({ onBack = () => {}, onAddProduct = () => {}, activeCategory = 'All', setActiveCategory = () => {} }) => (
    <div>
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
                <button className="p-2 mr-3 rounded-full bg-white shadow-sm border border-gray-100" onClick={onBack} aria-label="Back">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <div>
                    <h1 className="text-xl font-semibold">My Listings</h1>
                    <div className="text-xs text-gray-500">0 product listings</div>
                </div>
            </div>
            <div>
                <button
                    className="px-2 py-1 bg-white border border-gray-200 rounded-sm text-xs"
                >
                    Switch Mode
                </button>
            </div>
        </div>

        <div className="mb-3 -mx-2">
            <div className="flex items-center space-x-2 px-2 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                {['All', 'Electronics', 'Fashion', 'Beauty', 'Health & Fitness', 'Home', 'Outdoors', 'Toys', 'Books'].map((c) => (
                    <CategoryPill key={c} label={c} active={c === activeCategory} onClick={() => setActiveCategory(c)} />
                ))}
            </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                <div className="text-xs text-gray-500">Total Sales</div>
                <div className="text-xl text-[var(--color-gold)] font-semibold mt-1">0</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                <div className="text-xs text-gray-500">Total Views</div>
                <div className="text-xl text-[var(--color-gold)] font-semibold mt-1">0</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                <div className="text-xs text-gray-500">Revenue</div>
                <div className="text-xl text-[var(--color-gold)] font-semibold mt-1">$0</div>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-md bg-gray-50 mb-4">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4.46a2 2 0 0 0 2 0l7-4.46A2 2 0 0 0 21 16z"/><path d="M12 7v5"/></svg>
            </div>
            <h3 className="text-lg font-semibold mb-1">No product listings yet</h3>
            <div className="text-sm text-gray-500 mb-4">Start by adding your first product to sell</div>
            <button className="px-4 py-2 bg-[var(--color-gold)] text-white rounded-lg font-semibold inline-flex items-center text-sm" onClick={onAddProduct}>
                <span className="mr-2">+</span> Add Product
            </button>
        </div>
    </div>
);

const CategorySelect = ({ value, onChange, options = [] }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onDoc = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50 text-left flex items-center justify-between"
            >
                <span className="text-sm">{value}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M6 9l6 6 6-6"/></svg>
            </button>

            {open && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-60 overflow-y-auto">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => { onChange(opt); setOpen(false); }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between ${opt === value ? 'bg-gray-50' : ''}`}
                        >
                            <span className="text-sm">{opt}</span>
                            {opt === value && <Icon name="check" className="text-[var(--color-gold)]" />}
                        </button>
                    ))}

                    <div className="flex items-center justify-center py-2 text-gray-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                </div>
            )}
        </div>
    );
};

const UrgencySelect = ({ value, onChange, options = [] }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onDoc = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className="w-full rounded-lg border border-gray-200 p-3 bg-white text-left flex items-center justify-between"
            >
                <span className="text-sm flex items-center gap-2">{options.find(o=>o.value===value)?.icon && <Icon name={options.find(o=>o.value===value)?.icon} size={16} />} <span>{value}</span></span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M6 9l6 6 6-6"/></svg>
            </button>

            {open && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between ${opt.value === value ? 'bg-gray-50' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                {opt.icon && <Icon name={opt.icon} size={18} />}
                                <span className="text-sm">{opt.label}</span>
                            </div>
                            {opt.value === value && <Icon name="check" className="text-[var(--color-gold)]" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const AddProductModal = ({ onClose = () => {}, onSubmit = (p) => {} }) => {
    const [listingType, setListingType] = useState('Physical Product');
    const [brand, setBrand] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Electronics');
    const [urgency, setUrgency] = useState('None');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [commission, setCommission] = useState('15');
    const [imageUrl, setImageUrl] = useState('');
    const [buyUrl, setBuyUrl] = useState('');
    const [affiliateLink, setAffiliateLink] = useState('');
    const [sellDirectly, setSellDirectly] = useState(false);

    const handleAdd = () => {
        const newProduct = {
            id: Date.now(),
            image: imageUrl || 'https://images.unsplash.com/photo-1518444020784-25a1e6ff4b9e?auto=format&fit=crop&w=800&q=60',
            title: name || 'New Product',
            subtitle: brand || 'Brand',
            description,
            price: price ? `$${price}` : '$0.00',
            tag: '',
            commission: commission || '10',
            buyUrl,
            affiliateLink,
            listingType,
            category,
            urgency,
            sellDirectly,
        };
        onSubmit(newProduct);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start">
                            <div className="w-10 h-10 rounded-lg bg-[var(--color-gold-cream)] flex items-center justify-center mr-3">+</div>
                            <div>
                                <h2 className="text-lg font-semibold">Add New Product</h2>
                                <div className="text-xs text-gray-500">List your product to start earning through video commerce</div>
                            </div>
                        </div>
                        <button className="p-2 rounded-full text-gray-600" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
                    </div>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4 text-sm">
                    <div className="rounded-lg p-4 border border-[var(--color-gold-light)] bg-[var(--color-gold-cream)] text-[var(--color-gold)]">
                        <div className="font-semibold">Premium Feature</div>
                        <div className="text-sm text-[var(--color-gold)]">Upgrade to Premium to add products and access the full marketplace</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Listing Type *</label>
                        <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50">
                            <option>Physical Product</option>
                            <option>Digital Product</option>
                        </select>
                        <div className="text-xs text-gray-400 mt-1">A product that can be purchased via external link</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name *</label>
                        <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g., TechGear" className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Wireless Headphones" className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                        <CategorySelect
                            value={category}
                            onChange={setCategory}
                            options={[
                                'Electronics',
                                'Fashion',
                                'Beauty',
                                'Health & Fitness',
                                'Home & Garden',
                                'Books & Education',
                                'Food & Beverage',
                                'Sports',
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M15 18l-6-6 6-6" /></svg>
                            ]}
                        />
                    </div>
                                                    <div className="text-xs text-gray-500">0 product listings</div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product features and benefits..." className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50 h-28" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
                            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="299.99" className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Commission (%) *</label>
                            <input value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="15" className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50" />
                            <div className="text-xs text-gray-400 mt-1">Between 5% and 50%</div>
                        </div>
                    </div>

                    <div className="rounded-lg p-4 border border-gray-100 bg-gray-50">
                        <div className="font-semibold">Urgency Cues (Optional)</div>
                        <div className="text-sm text-gray-500 mt-1">Add urgency to boost conversions and create FOMO</div>
                        <div className="mt-3">
                            <UrgencySelect
                                value={urgency}
                                onChange={setUrgency}
                                options={[
                                    { value: 'None', label: 'None', icon: null },
                                    { value: 'Limited Time Offer', label: 'Limited Time Offer', icon: 'clock' },
                                    { value: 'Limited Stock', label: 'Limited Stock', icon: 'package' },
                                    { value: 'Flash Sale', label: 'Flash Sale', icon: 'zap' },
                                    { value: 'BOGO / Special Deal', label: 'BOGO / Special Deal', icon: 'gift' },
                                    { value: 'Countdown Timer', label: 'Countdown Timer', icon: 'timer' },
                                    { value: 'Exclusive Offer', label: 'Exclusive Offer', icon: 'crown' },
                                ]}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Image URL</label>
                        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50" />
                    </div>

                    <div className="rounded-lg p-4 border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div>
                            <div className="font-semibold">Sell directly on platform</div>
                            <div className="text-sm text-gray-500">Customers will be redirected to your external website to complete purchase</div>
                        </div>
                        <div>
                            <label className="switch">
                                <input type="checkbox" checked={sellDirectly} onChange={(e) => setSellDirectly(e.target.checked)} />
                                <span className="slider" />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Buy URL *</label>
                        <input value={buyUrl} onChange={(e) => setBuyUrl(e.target.value)} placeholder="https://yourstore.com/product" className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50" />
                        <div className="text-xs text-gray-400 mt-1">Direct link where customers can purchase this product</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Affiliate Link (optional)</label>
                        <input value={affiliateLink} onChange={(e) => setAffiliateLink(e.target.value)} placeholder="Auto-generated if left empty" className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50" />
                        <div className="text-xs text-gray-400 mt-1">Leave empty to auto-generate a unique affiliate link</div>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg" onClick={onClose}>Cancel</button>
                        <button className="px-4 py-2 bg-[var(--color-gold)] text-white rounded-lg" onClick={handleAdd}><span className="mr-2">+</span> Add Product</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CampaignModal = ({ onClose = () => {}, onCreate = (c) => {} }) => {
    const [brandName, setBrandName] = useState('');
    const [campaignName, setCampaignName] = useState('');
    const [category, setCategory] = useState('Electronics');
    const [description, setDescription] = useState('');
    const [paymentModel, setPaymentModel] = useState('CPM');
    const [paymentAmount, setPaymentAmount] = useState('50');
    const [additionalCommission, setAdditionalCommission] = useState('15');
    const [videoUrl, setVideoUrl] = useState('');
    const [placementInstructions, setPlacementInstructions] = useState('');
    const [tags, setTags] = useState('');
    const [allowNegotiation, setAllowNegotiation] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState('');

    const handleCreate = () => {
        const campaign = {
            id: Date.now(),
            brandName,
            campaignName,
            category,
            description,
            paymentModel,
            paymentAmount,
            additionalCommission,
            videoUrl,
            placementInstructions,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            allowNegotiation,
            thumbnailUrl,
        };
        onCreate(campaign);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start">
                            <div className="w-10 h-10 rounded-lg bg-[var(--color-gold-cream)] flex items-center justify-center mr-3"><Icon name="video" /></div>
                            <div>
                                <h2 className="text-lg font-semibold">Create Brand Campaign</h2>
                                <div className="text-xs text-gray-500">Create a sponsored content campaign for creators to promote your brand</div>
                            </div>
                        </div>
                        <button className="p-2 rounded-full text-gray-600" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
                    </div>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4 text-sm">
                    <div className="rounded-lg p-4 border border-[var(--color-gold-light)] bg-[var(--color-gold-cream)] text-[var(--color-gold)]">
                        <div className="font-semibold">Premium Feature</div>
                        <div className="text-sm text-[var(--color-gold)]">Upgrade to Premium to create brand campaigns</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name *</label>
                        <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g., Nike" className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name *</label>
                        <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g., Air Max Campaign - Lifestyle Integration" className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                        <CategorySelect value={category} onChange={setCategory} options={[
                            'Electronics','Fashion','Beauty','Health & Fitness','Home & Garden','Books & Education','Food & Beverage','Sports','Gaming'
                        ]} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Description *</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your campaign goals, target audience, and what you're looking for in creators..." className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50 h-28" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Model *</label>
                        <CategorySelect value={paymentModel} onChange={setPaymentModel} options={["CPM", "CPA", "Flat"]} />
                        <div className="text-xs text-gray-400 mt-1">Pay per 1,000 views (CPM) or choose another model</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end">
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount ($) *</label>
                            <input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50 h-12" />
                            <div className="text-xs text-gray-400 mt-1">Per 1,000 views</div>
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Commission (%) *</label>
                            <input value={additionalCommission} onChange={(e) => setAdditionalCommission(e.target.value)} className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50 h-12" />
                            <div className="text-xs text-gray-400 mt-1">5-50% on sales</div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Video URL (optional)</label>
                        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://example.com/campaign-video.mp4" className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50" />
                        <div className="text-xs text-gray-400 mt-1">Add a video brief showing product and campaign expectations</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Placement Instructions *</label>
                        <textarea value={placementInstructions} onChange={(e) => setPlacementInstructions(e.target.value)} placeholder="Describe how you want creators to integrate your product in their videos. Include details like: duration, placement style, mentions, disclaimers, etc." className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50 h-28" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tech, Gaming, Review, Lifestyle" className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50" />
                        <div className="text-xs text-gray-400 mt-1">Help creators find your campaign</div>
                    </div>

                    <div className="rounded-lg p-4 border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div>
                            <div className="font-semibold">Allow Negotiation</div>
                            <div className="text-sm text-gray-500">Let creators negotiate terms with you</div>
                        </div>
                        <div>
                            <label className="switch">
                                <input type="checkbox" checked={allowNegotiation} onChange={(e) => setAllowNegotiation(e.target.checked)} />
                                <span className="slider" />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Thumbnail URL</label>
                        <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full rounded-lg border border-gray-200 p-3 bg-gray-50" />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg" onClick={onClose}>Cancel</button>
                        <button className="px-4 py-2 bg-[var(--color-gold)] text-white rounded-lg" onClick={handleCreate}><Video size={16} className="mr-2" /> Create Campaign</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProductDetailsModal = ({ product, onClose = () => {}, onCopy = () => {}, onBuy = () => {} }) => {
    if (!product) return null;
    const handleCopy = () => {
        const url = product.buyUrl || window.location.href;
        try { navigator.clipboard && navigator.clipboard.writeText(url); } catch (e) { /* ignore */ }
    };

    // also notify parent to show a toast
    const handleCopyAndNotify = () => {
        const url = product.buyUrl || window.location.href;
        try { navigator.clipboard && navigator.clipboard.writeText(url); } catch (e) { /* ignore */ }
        try { onCopy && onCopy(product); } catch (e) { /* ignore */ }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start">
                            <div className="w-10 h-10 rounded-lg bg-[var(--color-gold-cream)] flex items-center justify-center mr-3"><ShoppingBag size={20} className="text-[var(--color-gold)]" /></div>
                            <div>
                                <h2 className="text-lg font-semibold">Product Details</h2>
                                <div className="text-xs text-gray-500">View product information and get your affiliate link</div>
                            </div>
                        </div>
                        <button className="p-2 rounded-full text-gray-600" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
                    </div>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4 text-sm">
                    <div className="w-full rounded-lg overflow-hidden bg-gray-50">
                        <img src={product.image} alt={product.title} className="w-full h-56 object-cover" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/800x450?text=Image+Unavailable'; }} />
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold leading-tight">{product.title}</h3>
                        <div className="text-sm text-gray-500">{product.subtitle}</div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl text-[var(--color-gold)] font-semibold">{product.price}</div>
                        </div>
                        <div className="text-xs bg-gray-100 rounded-full px-3 py-1">% {product.commission} commission</div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <button onClick={() => { try { onBuy && onBuy(product); } catch(e) {} }} className="w-full px-3 py-2 bg-[var(--color-gold)] text-white rounded-lg inline-flex items-center justify-center text-sm">
                            <ShoppingBag size={16} className="mr-2" /> Buy Now
                        </button>
                        <button onClick={handleCopyAndNotify} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg inline-flex items-center justify-center text-sm">
                            <Link2 size={16} className="mr-2" /> Copy Link
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BrandCampaignsView = ({ onBack = () => {}, onCreate = () => {}, campaigns = [], onRequestDelete = () => {}, activeCategory = 'All', setActiveCategory = () => {} }) => (
    <div>
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
                <button className="p-2 mr-3 rounded-full bg-white shadow-sm border border-gray-100" onClick={onBack} aria-label="Back">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <div>
                    <h1 className="text-xl font-semibold">Brand Campaigns</h1>
                    <div className="text-xs text-gray-500">{campaigns.length} active campaign{campaigns.length !== 1 ? 's' : ''}</div>
                </div>
            </div>
            <div>
                <button className="px-2 py-1 bg-white border border-gray-200 rounded-sm text-xs" onClick={() => {}}>
                    Switch Mode
                </button>
            </div>
        </div>

        <div className="mb-3 -mx-2">
            <div className="flex items-center space-x-2 px-2 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                {['All', 'Electronics', 'Fashion', 'Beauty', 'Health & Fitness', 'Home', 'Outdoors', 'Toys', 'Books'].map((c) => (
                    <CategoryPill key={c} label={c} active={c === activeCategory} onClick={() => setActiveCategory(c)} />
                ))}
            </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                <div className="text-xs text-gray-500">Campaigns</div>
                <div className="text-xl text-[var(--color-gold)] font-semibold mt-1">0</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                <div className="text-xs text-gray-500">Total Views</div>
                <div className="text-xl text-[var(--color-gold)] font-semibold mt-1">0</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                <div className="text-xs text-gray-500">Creators</div>
                <div className="text-xl text-[var(--color-gold)] font-semibold mt-1">0</div>
            </div>
        </div>

        {campaigns.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-md bg-gray-50 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </div>
                <h3 className="text-lg font-semibold mb-1">No campaigns yet</h3>
                <div className="text-sm text-gray-500 mb-4">Create your first brand campaign to connect with creators</div>
                <button className="px-4 py-2 bg-[var(--color-gold)] text-white rounded-lg font-semibold inline-flex items-center text-sm" onClick={onCreate}>
                    <span className="mr-2">+</span> Create Campaign
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaigns.map((c) => (
                        <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-start">
                            <div className="w-28 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 mr-4">
                                <img src={c.thumbnailUrl || 'https://via.placeholder.com/320x180?text=Campaign'} alt={c.campaignName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/320x180?text=Campaign'; }} />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm text-gray-500">{c.brandName} • {c.category}</div>
                                <h3 className="text-lg font-semibold mt-1 mb-2">{c.campaignName}</h3>
                                <div className="text-sm text-gray-600 mb-2">{c.description && (c.description.length > 120 ? c.description.slice(0, 120) + '…' : c.description)}</div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs bg-gray-100 rounded-full px-3 py-1">{c.paymentModel} • ${c.paymentAmount}</div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); try { navigator.clipboard && navigator.clipboard.writeText(window.location.href + '#campaign-' + c.id); } catch (err) {} }} className="px-3 py-1 rounded-md bg-white border border-gray-200 text-sm">Link</button>
                                        <button onClick={(e) => { e.stopPropagation(); onRequestDelete(c.id); }} className="px-3 py-1 rounded-md bg-red-50 border border-red-100 text-red-600 text-sm">Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const PaymentModal = ({ product, onClose = () => {}, onOpen = () => {}, onSelect = () => {}, onPay = (option) => {} }) => {
    if (!product) return null;
    const options = [
        { id: 'card', label: 'Credit / Debit Card' },
        { id: 'paypal', label: 'PayPal' },
        { id: 'wallet', label: 'Wallet' },
        { id: 'apple', label: 'Apple Pay' },
        { id: 'google', label: 'Google Pay' },
    ];

    const [selected, setSelected] = useState(null);

    useEffect(() => {
        try { onOpen && onOpen(product); } catch (e) { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center">
                        <CreditCard size={24} className="mr-2" style={{ color: 'var(--color-gold)' }} />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Choose Payment Method</h2>
                            <div className="text-sm text-gray-600">Select how you'd like to complete the purchase</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="w-full rounded-lg overflow-hidden bg-gray-50">
                            <img src={product.image} alt={product.title} className="w-full h-40 object-cover" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/800x450?text=Image+Unavailable'; }} />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold">{product.title}</h3>
                            <div className="text-sm text-gray-500">{product.subtitle} • {product.price}</div>
                        </div>

                        <div className="grid gap-3">
                            {options.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => { setSelected(opt.id); try { onSelect && onSelect(opt.id); } catch (e) {} }}
                                    className={`w-full text-left px-4 py-3 rounded-lg border ${selected === opt.id ? 'border-[var(--color-gold)] bg-[var(--color-gold-cream)]' : 'border-gray-200 bg-white'} hover:bg-gray-50 flex items-center justify-between`}
                                >
                                    <span>{opt.label}</span>
                                    {selected === opt.id && <Icon name="check" className="text-[var(--color-gold)]" />}
                                </button>
                            ))}
                        </div>

                        <div className="flex space-x-2">
                            <button className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg" onClick={onClose}>Cancel</button>
                            <button
                                className={`px-4 py-2 rounded-lg ${selected ? 'bg-[var(--color-gold)] text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                onClick={() => { if (selected) { try { onPay(selected); } catch (e) {} }} }
                                disabled={!selected}
                                style={selected ? { backgroundColor: localColor } : {}}
                            >
                                Continue
                            </button>
                        </div>
                </div>
            </div>
        </div>
    );
};

// --- BottomBar copied verbatim from home.jsx (keeps padding & behavior) ---
const BottomBar = () => {
    const [activeTab, setActiveTab] = useState('');
    const navigatedRef = useRef(false);

    // The Requests tab should always be available in the footer. Tooltip
    // visibility for the Requested badge is handled at the App/ContentCard level
    // via the `hasSeenRequests` localStorage flag — do not hide the footer tab.
    const tabs = [
        { name: 'Home', icon: 'home' },
        { name: 'Requests', icon: 'requests' },
        // Changed 'Ideas' to 'Pencil' icon
        { name: 'Ideas', icon: 'pencil' },
        { name: 'More', icon: 'more' },
    ];

    const inactiveColor = 'rgb(107 114 128)';

        return (
        <div
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
            style={{
                paddingTop: '10px',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                minHeight: '70px'
            }}
        >
            <div className="w-full flex justify-around items-center px-2">
                    {tabs.map((tab) => {
                    const isSelected = tab.name === activeTab;

                    const iconClass = isSelected ? 'text-[var(--color-gold)]' : 'text-gray-500';
                    const textWeight = isSelected ? 'font-semibold' : 'font-normal';

                    const navigateToTab = (tabName) => {
                        try {
                            if (tabName === 'Home') {
                                window.location.href = '/home.jsx';
                                return;
                            }
                            if (tabName === 'Requests') {
                                window.location.href = '/requests.jsx';
                                return;
                            }
                            if (tabName === 'Ideas') {
                                window.location.href = '/ideas';
                                return;
                            }
                            if (tabName === 'More') {
                                window.location.href = '/more.jsx';
                                return;
                            }
                        } catch (e) {
                            console.warn('Navigation failed', e);
                        }
                    };

                    return (
                        <div
                            key={tab.name}
                            className="relative flex flex-col items-center w-1/4 focus:outline-none"
                        >
                            <button
                                className="flex flex-col items-center w-full transition-all duration-150"
                                onMouseDown={() => {
                                    setActiveTab(tab.name);
                                    if (!navigatedRef.current) { navigatedRef.current = true; navigateToTab(tab.name); }
                                }}
                                onTouchStart={() => {
                                    setActiveTab(tab.name);
                                    if (!navigatedRef.current) { navigatedRef.current = true; navigateToTab(tab.name); }
                                }}
                                onClick={(e) => {
                                    if (navigatedRef.current) { navigatedRef.current = false; e.preventDefault(); return; }
                                    setActiveTab(tab.name);
                                    navigateToTab(tab.name);
                                }}
                            >
                                                <div className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors">
                                                    <Icon
                                                        name={tab.icon}
                                                        size={24}
                                                        strokeWidth={isSelected ? 2 : 1.5}
                                                        style={isSelected ? { color: 'var(--color-gold)' } : { color: 'rgb(107 114 128)' }}
                                                    />
                                                </div>
                                                <span className={`text-xs leading-tight mt-1 ${textWeight}`} style={isSelected ? { color: 'var(--color-gold)' } : { color: 'rgb(107 114 128)' }}>
                                                    {tab.name}
                                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Marketplace = () => {
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [showModeSelector, setShowModeSelector] = useState(false);
    const [mode, setMode] = useState('grid'); // 'grid' or 'browse' or 'sell'
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentProduct, setPaymentProduct] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [toastRendered, setToastRendered] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimerRef = useRef(null);
    const toastUnmountTimerRef = useRef(null);

    // Mode selector event helpers
    const openModeSelector = () => {
        try { console.log('Mode selector opened'); } catch (e) {}
        setShowModeSelector(true);
    };

    const closeModeSelector = () => {
        try { console.log('Mode selector closed'); } catch (e) {}
        setShowModeSelector(false);
    };

    const selectMode = (m) => {
        try { console.log('Mode selected', m); } catch (e) {}
        setMode(m);
        setShowModeSelector(false);
        // user feedback
        showToastMessage(`Mode switched to ${m === 'browse' ? 'Browse' : m === 'sell' ? 'Sell' : m === 'campaigns' ? 'Campaigns' : 'Grid'}`);
    };

    const initialProducts = [
        {
            id: 1,
            image: 'https://images.unsplash.com/photo-1518444020784-25a1e6ff4b9e?auto=format&fit=crop&w=800&q=60',
            title: 'Wireless Noise-Canceling Headphones',
            subtitle: 'TechGear',
            description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and comfortable ear cushions.',
            price: '$299.99',
            tag: '50% OFF',
            commission: '15'
        },
        {
            id: 2,
            image: 'https://images.unsplash.com/photo-1523475496153-3d6cc8f3d0b9?auto=format&fit=crop&w=800&q=60',
            title: 'Smart Fitness Tracker',
            subtitle: 'FitPro',
            description: 'Track your workouts, heart rate, sleep quality, and more with this advanced fitness tracker.',
            price: '$129.99',
            tag: '% 20',
            commission: '20'
        },
        {
            id: 3,
            image: 'https://images.unsplash.com/photo-1582719478184-6d3b1d4b4b23?auto=format&fit=crop&w=800&q=60',
            title: 'Luxury Skincare Set',
            subtitle: 'GlowUp',
            description: 'Complete 5-piece skincare routine with vitamin C serum, hyaluronic acid, and SPF protection.',
            price: '$89.99',
            tag: '% 25',
            commission: '25'
        }
    ];

    const [products, setProducts] = useState(initialProducts);
    const [campaigns, setCampaigns] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
    const searchRef = useRef(null);

    const showToastMessage = (msg = 'Done') => {
        setToastMessage(msg);

        // clear existing timers
        if (toastTimerRef.current) { clearTimeout(toastTimerRef.current); toastTimerRef.current = null; }
        if (toastUnmountTimerRef.current) { clearTimeout(toastUnmountTimerRef.current); toastUnmountTimerRef.current = null; }

        // mount and animate in
        setToastRendered(true);
        // ensure the visible class is applied on next frame for transition
        requestAnimationFrame(() => setToastVisible(true));

        // after visible duration, animate out then unmount
        toastTimerRef.current = setTimeout(() => {
            setToastVisible(false);
            toastTimerRef.current = null;
            // allow fade-out duration before unmount
            toastUnmountTimerRef.current = setTimeout(() => {
                setToastRendered(false);
                toastUnmountTimerRef.current = null;
            }, 300);
        }, 2200);
    };

    const handleCopyLink = (pOrUrl) => {
        const url = typeof pOrUrl === 'string' ? pOrUrl : (pOrUrl?.buyUrl || '');
        try { navigator.clipboard && navigator.clipboard.writeText(url || window.location.href); } catch(e) {}
        showToastMessage('Link successfully copied');
    };

    // Live filtered products based on search query and active category
    const filteredProducts = products.filter((p) => {
        // category filter
        if (activeCategory && activeCategory !== 'All') {
            const catMatch = (p.category || p.tag || '').toLowerCase().includes(activeCategory.toLowerCase());
            if (!catMatch) return false;
        }

        if (!query) return true;
        const q = query.trim().toLowerCase();
        return [p.title, p.subtitle, p.description, p.tag, p.price].some(field => (field || '').toString().toLowerCase().includes(q));
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 pt-6 pb-40">
                {mode !== 'campaigns' && mode !== 'sell' && (
                    <>
                        <div className="flex items-center justify-between mb-4 px-3 py-3 bg-gradient-to-b from-[rgba(203,138,0,0.06)] to-transparent rounded-xl">
                            <div className="flex items-center">
                                <button className="p-2 mr-3 rounded-full bg-white shadow-sm border border-gray-100"><Icon name="menu" /></button>
                                <div>
                                    <h1 className="text-xl font-semibold">Marketplace</h1>
                                    <div className="text-sm text-gray-500">Discover products from creators</div>
                                </div>
                            </div>
                            <div>
                                <button
                                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm"
                                    onClick={openModeSelector}
                                >
                                    Switch Mode
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 mb-4">
                            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                                <div className="relative">
                                    <input
                                        ref={searchRef}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search products..."
                                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 placeholder-gray-400"
                                    />
                                    <div className="absolute right-3 top-3"><button type="button" onClick={() => searchRef.current && searchRef.current.focus()} className="p-1 rounded-md"><Icon name="search" /></button></div>
                                </div>

                                {mode !== 'sell' && (
                                    <div className="mt-3 -mx-2">
                                        <div className="flex items-center space-x-2 px-2 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                                            {['All', 'Electronics', 'Fashion', 'Beauty', 'Health & Fitness', 'Home', 'Outdoors', 'Toys', 'Books'].map((c) => (
                                                <CategoryPill key={c} label={c} active={c === activeCategory} onClick={() => setActiveCategory(c)} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>


                    </>
                )}

                {mode === 'sell' ? (
                    <SellProductsView onBack={() => setMode('grid')} onAddProduct={() => setShowAddProductModal(true)} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
                ) : mode === 'campaigns' ? (
                    <BrandCampaignsView onBack={() => setMode('grid')} onCreate={() => { setShowCampaignModal(true); }} campaigns={campaigns} onRequestDelete={(id) => {
                        const c = campaigns.find(x => x.id === id);
                        setDeleteConfirm({ open: true, id, name: c?.campaignName || '' });
                    }} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
                ) : mode === 'browse' ? (
                    <div className="space-y-3">
                        {filteredProducts.map((p) => (
                            <ListProductCard key={p.id} p={p} onOpen={(prod) => { setSelectedProduct(prod); setShowProductModal(true); }} onBuy={(prod) => { setSelectedProduct(prod); setShowProductModal(true); }} onCopy={handleCopyLink} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProducts.map((p) => (
                            <div key={p.id} className="p-1">
                                <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm" onClick={() => { setSelectedProduct(p); setShowProductModal(true); }}>
                                    <div className="relative h-64 bg-gray-100">
                                        <img src={p.image} alt={p.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/800x450?text=Image+Unavailable'; }} />
                                        <div className="absolute top-3 left-3 bg-[var(--color-gold-cream)] text-xs font-semibold text-black px-2 py-1 rounded-md">{p.tag}</div>
                                        {/* price moved below image for better mobile harmony */}
                                    </div>

                                    <div className="p-4">
                                        <div className="text-sm text-gray-500">{p.subtitle}</div>
                                        <h3 className="text-lg font-semibold mt-1 mb-2" style={{...{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}}>{p.title}</h3>
                                        <div className="text-xl text-[var(--color-gold)] font-semibold mt-2">{p.price}</div>

                                        <div className="flex items-center justify-between mt-3">
                                            <div className="text-xs bg-gray-100 rounded-full px-3 py-1">% {p.commission} commission</div>
                                            <div className="flex flex-col sm:flex-row sm:space-x-2 gap-2 items-center">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); setShowProductModal(true); }} className="h-8 px-2.5 rounded-md bg-[var(--color-gold)] text-white font-semibold text-xs flex items-center">
                                                    <ShoppingBag size={14} className="mr-2" /> Buy
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleCopyLink(p); }} className="h-8 px-2.5 rounded-md bg-white border border-gray-200 text-xs inline-flex items-center">
                                                    <Link2 size={14} className="mr-2" /> Link
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Mode selector overlay/modal */}
            {showModeSelector && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40" onClick={closeModeSelector}>
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold">Marketplace</h2>
                                    <div className="text-sm text-gray-500">Choose your mode</div>
                                </div>
                                <button className="p-2 rounded-full text-gray-600" onClick={closeModeSelector} aria-label="Close">
                                    <Icon name="x" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div
                                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm cursor-pointer"
                                onClick={() => selectMode('browse')}
                                role="button"
                            >
                                <div className="flex items-start">
                                    <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center mr-4">
                                                <Icon name="search" size={20} className="text-yellow-700" />
                                            </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold">Browse & Shop</h3>
                                        <p className="text-sm text-gray-500 mt-1">Discover products from creators, earn from sharing affiliate links, and find deals on items featured in videos.</p>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm">Curated Products</span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm">Exclusive Deals</span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm">Earn Commissions</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm cursor-pointer"
                                onClick={() => selectMode('sell')}
                                role="button"
                            >
                                <div className="flex items-start">
                                    <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center mr-4">
                                        <Icon name="marketplace" size={20} className="text-yellow-700" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold">Sell Products</h3>
                                        <p className="text-sm text-gray-500 mt-1">List your products, embed them in videos, pay affiliates, and grow your business with integrated video commerce.</p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm">Product Listings</span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm">Video Integration</span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm">Affiliate Network</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm cursor-pointer"
                                onClick={() => selectMode('campaigns')}
                                role="button"
                            >
                                <div className="flex items-start">
                                    <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center mr-4">
                                        <Icon name="zap" size={20} className="text-yellow-700" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold">Brand Campaigns</h3>
                                        <p className="text-sm text-gray-500 mt-1">Create sponsored content campaigns, connect with creators, and amplify your brand through authentic video integrations.</p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm">Campaign Creation</span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm">Creator Network</span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-sm">Campaign Analytics</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-sm text-gray-600">
                                <div className="flex items-start">
                                    <div className="mr-3 text-gray-500 mt-0.5"><Icon name="info" /></div>
                                    <div>
                                        <strong className="block">You can switch modes anytime.</strong>
                                        <div>Your data and products are saved across both modes.</div>
                                    </div>
                                </div>
                            </div>

                            {/* Removed Cancel / Continue buttons per request */}
                        </div>
                    </div>
                </div>
            )}

            {showAddProductModal && (
                <AddProductModal
                    onClose={() => setShowAddProductModal(false)}
                    onSubmit={(prod) => {
                        setProducts((prev) => [prod, ...prev]);
                        // optionally switch view to show new product
                        setMode('browse');
                    }}
                />
            )}

            {showCampaignModal && (
                <CampaignModal
                    onClose={() => setShowCampaignModal(false)}
                    onCreate={(campaign) => {
                        try {
                            setCampaigns((prev) => [campaign, ...prev]);
                            // Also add a marketplace product entry for the campaign so it appears in the marketplace
                            try {
                                const prod = {
                                    id: Date.now(),
                                    image: campaign.thumbnailUrl || 'https://via.placeholder.com/800x450?text=Campaign',
                                    title: campaign.campaignName || 'New Campaign',
                                    subtitle: campaign.brandName || 'Brand',
                                    description: campaign.description || '',
                                    price: campaign.paymentAmount ? `$${campaign.paymentAmount}` : '$0.00',
                                    tag: campaign.tags && campaign.tags.length ? campaign.tags[0] : '',
                                    commission: campaign.additionalCommission || '0',
                                    buyUrl: campaign.buyUrl || '',
                                    category: campaign.category || '',
                                };
                                setProducts((prev) => [prod, ...prev]);
                            } catch (e) {
                                console.error('Failed to add campaign as product', e);
                            }
                            showToastMessage('Campaign created');
                        } catch (e) { console.error(e); }
                    }}
                />
            )}

            {/* Delete confirmation modal for campaigns */}
            {deleteConfirm.open && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40" onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}>
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">Delete Campaign</h2>
                                    <div className="text-xs text-gray-500">This action cannot be undone</div>
                                </div>
                                <button className="p-2 rounded-full text-gray-600" onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })} aria-label="Close"><Icon name="x" /></button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4 text-sm">
                            <div className="text-gray-700">Are you sure you want to delete the campaign <strong>{deleteConfirm.name}</strong>?</div>
                            <div className="flex justify-end space-x-2">
                                <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg" onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}>Cancel</button>
                                <button className="px-4 py-2 bg-red-600 text-white rounded-lg" onClick={() => {
                                    try {
                                        setCampaigns((prev) => prev.filter(c => c.id !== deleteConfirm.id));
                                        showToastMessage('Campaign deleted');
                                    } catch (e) { console.error(e); }
                                    setDeleteConfirm({ open: false, id: null, name: '' });
                                }}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showProductModal && (
                <ProductDetailsModal product={selectedProduct} onClose={() => { setShowProductModal(false); setSelectedProduct(null); }} onCopy={handleCopyLink} onBuy={(prod) => { setPaymentProduct(prod); setShowPaymentModal(true); }} />
            )}

            {showPaymentModal && (
                <PaymentModal
                    product={paymentProduct}
                    onOpen={(prod) => { try { console.log('PaymentModal opened for', prod); } catch (e) {} }}
                    onSelect={(opt) => { try { showToastMessage(`Selected payment: ${opt}`); } catch (e) {} }}
                    onClose={() => { setShowPaymentModal(false); setPaymentProduct(null); }}
                    onPay={(option) => {
                        try { window.open(paymentProduct?.buyUrl || '#', '_blank'); } catch (e) { /* ignore */ }
                        setShowPaymentModal(false);
                        setShowProductModal(false);
                        setSelectedProduct(null);
                        showToastMessage('Redirecting to payment');
                    }}
                />
            )}

            {/* Toast */}
            {toastRendered && (
                <div 
                    className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-50 transition-all duration-300 ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} 
                    aria-live="polite"
                    style={{
                        animation: toastVisible ? 'toastSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
                    }}
                    onTouchStart={(e) => {
                        e.currentTarget.dataset.dragStartX = e.touches[0].clientX;
                    }}
                    onTouchMove={(e) => {
                        const startX = parseFloat(e.currentTarget.dataset.dragStartX || '0');
                        const diff = e.touches[0].clientX - startX;
                        e.currentTarget.style.transform = `translateX(calc(-50% + ${diff}px))`;
                    }}
                    onTouchEnd={(e) => {
                        const startX = parseFloat(e.currentTarget.dataset.dragStartX || '0');
                        const endX = e.changedTouches[0].clientX;
                        const diff = endX - startX;
                        if (Math.abs(diff) > 80) {
                            setToastVisible(false);
                            setTimeout(() => setToastRendered(false), 300);
                        } else {
                            e.currentTarget.style.transform = 'translateX(-50%)';
                        }
                        e.currentTarget.dataset.dragStartX = '0';
                    }}
                >
                    <style>{`
                        @keyframes toastSlideDown {
                            from {
                                opacity: 0;
                                transform: translateX(-50%) translateY(-20px) scale(0.95);
                            }
                            to {
                                opacity: 1;
                                transform: translateX(-50%) translateY(0) scale(1);
                            }
                        }
                    `}</style>
                    <div className="bg-black text-white text-sm px-4 py-2 rounded-lg shadow-lg cursor-grab select-none">{toastMessage}</div>
                </div>
            )}

            <BottomBar />
        </div>
    );
};

export default Marketplace;
