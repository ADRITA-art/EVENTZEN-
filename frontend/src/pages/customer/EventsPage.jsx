import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Ticket } from 'lucide-react';
import { getUpcomingEvents, searchEvents } from '../../api/events';
import StatusBadge from '../../components/ui/StatusBadge';
import BookNowModal from '../../components/customer/BookNowModal';
import Spinner from '../../components/ui/Spinner';
import { isValidIsoDate, toTrimmed } from '../../utils/validation';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({ location: '', date: '' });
  const [searchError, setSearchError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getUpcomingEvents();
      setEvents(res.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError('');

    const normalizedLocation = toTrimmed(search.location);
    const normalizedDate = toTrimmed(search.date);
    if (normalizedDate && !isValidIsoDate(normalizedDate)) {
      setSearchError('Please provide a valid date for search.');
      return;
    }

    setLoading(true);
    try {
      const res = await searchEvents(normalizedDate || undefined, normalizedLocation || undefined);
      setEvents(res.data);
    } catch (_) {}
    setLoading(false);
  };

  const handleClearSearch = () => {
    setSearch({ location: '', date: '' });
    setSearchError('');
    load();
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#191c1e', marginBottom: '0.25rem' }}>
          Upcoming Events
        </h1>
        <p style={{ color: '#434655' }}>Discover and book your next experience</p>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        className="card"
        style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}
      >
        <div style={{ flex: 2, minWidth: '160px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.35rem' }}>Location</label>
          <div style={{ position: 'relative' }}>
            <MapPin size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#737686' }} />
            <input
              id="event-search-location"
              type="text"
              placeholder="City or state…"
              value={search.location}
              onChange={(e) => setSearch({ ...search, location: e.target.value })}
              className="input-field"
              style={{ paddingLeft: '2rem' }}
            />
          </div>
        </div>
        <div style={{ flex: 2, minWidth: '160px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#434655', display: 'block', marginBottom: '0.35rem' }}>Date</label>
          <div style={{ position: 'relative' }}>
            <Calendar size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#737686' }} />
            <input
              id="event-search-date"
              type="date"
              value={search.date}
              onChange={(e) => setSearch({ ...search, date: e.target.value })}
              className="input-field"
              style={{ paddingLeft: '2rem' }}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '0.625rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Search size={15} /> Search
        </button>
        <button type="button" onClick={handleClearSearch} className="btn-secondary" style={{ padding: '0.625rem 1rem' }}>
          Clear
        </button>
        {searchError && (
          <div style={{ width: '100%', color: '#93000a', fontSize: '0.8rem', marginTop: '0.25rem' }}>{searchError}</div>
        )}
      </form>

      {/* Events Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Spinner size={48} />
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#434655' }}>
          <Calendar size={48} style={{ margin: '0 auto 1rem', color: '#c3c6d7' }} />
          <p style={{ fontWeight: 600 }}>No events found</p>
          <p style={{ fontSize: '0.875rem' }}>Try adjusting your search filters</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} onBook={() => setSelectedEvent(event)} />
          ))}
        </div>
      )}

      {selectedEvent && (
        <BookNowModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSuccess={() => { setSelectedEvent(null); load(); }}
        />
      )}
    </div>
  );
}

function EventCard({ event, onBook }) {
  const isSoldOut = event.status === 'SOLD_OUT';
  const isCancelled = event.status === 'CANCELLED';

  return (
    <div
      className="card animate-fade-in"
      style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(25,28,30,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#191c1e', flex: 1, marginRight: '0.5rem' }}>{event.name}</h3>
        <StatusBadge status={event.status} />
      </div>

      {event.description && (
        <p style={{ color: '#434655', fontSize: '0.875rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {event.description}
        </p>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#434655' }}>
          <Calendar size={14} color="#3650a0" />
          {event.eventDate} · {event.startTime?.slice(0, 5)} – {event.endTime?.slice(0, 5)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#434655' }}>
          <MapPin size={14} color="#3650a0" />
          {event.venueName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#434655' }}>
          <Ticket size={14} color="#3650a0" />
          {event.ticketAvailable} seats available · ₹{event.ticketPrice?.toLocaleString()}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onBook}
        disabled={isSoldOut || isCancelled}
        className="btn-primary"
        style={{ padding: '0.625rem', marginTop: '0.25rem', width: '100%' }}
      >
        {isSoldOut ? 'Sold Out' : isCancelled ? 'Cancelled' : 'Book Now'}
      </button>
    </div>
  );
}
