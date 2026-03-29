import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const accordionItems = [
  {
    id: 1,
    title: 'Event Management',
    description: 'Organize events with real-time scheduling and availability checks.',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Venue Management',
    description: 'Browse, add, and manage venues with pricing and capacity constraints.',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Vendor Coordination',
    description: 'Assign and manage vendors for catering, decoration, and more.',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 4,
    title: 'Budget Tracking',
    description: 'Monitor estimated vs actual costs and control your event spending.',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2036&auto=format&fit=crop',
  },
  {
    id: 5,
    title: 'Smart Bookings',
    description: 'Handle ticket bookings, availability, and customer management.',
    imageUrl: 'https://images.unsplash.com/photo-1540331547168-8b63109225b7?q=80&w=2019&auto=format&fit=crop',
  },
  {
    id: 6,
    title: 'Analytics & Insights',
    description: 'Get insights on revenue, expenses, and event performance.',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
  },
];

const AccordionItem = ({ item, isActive, onMouseEnter }) => {
  return (
    <div
      className={`
        relative h-[500px] rounded-3xl overflow-hidden cursor-pointer
        transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
        ${isActive ? 'w-[320px] md:w-[420px]' : 'w-[50px] md:w-[70px]'}
      `}
      onMouseEnter={onMouseEnter}
      style={{ boxShadow: isActive ? '0 15px 40px rgba(30, 58, 138, 0.25)' : 'none' }}
    >
      <img
        src={item.imageUrl}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: isActive ? 'brightness(1.05)' : 'brightness(0.65) grayscale(40%)',
          transition: 'filter 0.5s ease-in-out',
          objectPosition: 'center',
        }}
        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x480/2d3748/ffffff?text=EventZen'; }}
      />
      
      {/* Dark overlay for text readability */}
      <div 
        className="absolute inset-0 transition-opacity duration-700 ease-in-out"
        style={{
          background: isActive ? 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.4) 50%, transparent 100%)' : 'rgba(0,0,0,0.55)'
        }}
      ></div>

      <div
        className={`
          absolute w-full bottom-0 left-0 p-8 flex flex-col items-center justify-end
          transition-all duration-500 delay-100 ease-in-out
          ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
        `}
      >
        <span className="text-white text-2xl md:text-3xl font-extrabold mb-3 text-center" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
          {item.title}
        </span>
        <span className="text-blue-50 text-sm md:text-base text-center font-medium leading-relaxed max-w-[95%]">
          {item.description}
        </span>
      </div>

      <span
        className={`
          absolute text-white text-lg font-bold whitespace-nowrap tracking-wide
          transition-all duration-300 ease-in-out
          ${
            isActive
              ? 'opacity-0 invisible bottom-0 left-1/2 -translate-x-1/2 rotate-0'
              : 'opacity-100 visible w-auto text-left bottom-28 left-1/2 -translate-x-1/2 -rotate-90 origin-center'
          }
        `}
        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
      >
        {item.title}
      </span>
    </div>
  );
};

export default function LandingPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] via-white to-[#dce1ff] font-sans flex flex-col relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 pointer-events-none"></div>

      {/* ── NAVBAR ── */}
      <header className="relative z-20 w-full px-8 py-5 flex items-center">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="EventZen Logo"
            className="w-10 h-10 rounded-xl shadow-md border border-white"
          />
          <span className="text-[#1E3A8A] font-extrabold text-2xl tracking-tight">EventZen</span>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex items-center relative z-10">
        <section className="container mx-auto px-6 max-w-[1500px] w-full">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-16 xl:gap-20">

            {/* LEFT SIDE */}
            <div className="w-full xl:w-5/12 flex flex-col justify-center text-center xl:text-left max-w-[560px] mx-auto xl:mx-0">

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl xl:text-[3.25rem] font-extrabold text-[#191c1e] leading-[1.2] tracking-tight">
                Plan, Manage <br className="hidden xl:block" />
                &amp; Scale Events
                <span className="block text-[#1E3A8A] mt-1">
                  Seamlessly
                </span>
              </h1>

              {/* Subtext */}
              <p className="mt-5 text-base md:text-lg text-[#4b5563] leading-relaxed max-w-[480px] mx-auto xl:mx-0">
                Manage venues, vendors, bookings, and budgets — all in one powerful platform designed for modern event planning.
              </p>

              {/* Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-3">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto bg-[#1E3A8A] text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:bg-[#152a6b] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  Get Started
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto bg-white text-[#1E3A8A] font-semibold px-8 py-3 rounded-xl border border-[#1E3A8A]/25 hover:bg-blue-50 transition-all duration-200 text-sm md:text-base"
                >
                  Login to Account
                </button>
              </div>

              {/* Highlights */}
              <div className="mt-7 flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-5 text-sm font-medium text-[#6b7280]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">✓</div>
                  All-in-one Platform
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#1E3A8A] text-xs font-bold">✓</div>
                  Instant Setup
                </div>
              </div>

            </div>

            {/* RIGHT SIDE — untouched */}
            <div className="w-full xl:w-7/12 flex items-center justify-center xl:justify-end">
              <div
                className="flex flex-row items-center justify-start xl:justify-end gap-3 md:gap-4 overflow-x-auto xl:overflow-visible pb-8 pt-4 px-4 w-full scrollbar-hide"
                style={{ scrollbarWidth: 'none' }}
              >
                {accordionItems.map((item, index) => (
                  <AccordionItem
                    key={item.id}
                    item={item}
                    isActive={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                  />
                ))}
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}