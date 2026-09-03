import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { BookOpen, Search, Plus, CheckCircle2, Clock, FileText } from 'lucide-react';

interface BookItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}

const initialBooks: BookItem[] = [
  { id: 'b-1', isbn: '978-0131103627', title: 'The C Programming Language (2nd Ed)', author: 'Kernighan & Ritchie', category: 'Computer Science', totalCopies: 15, availableCopies: 8 },
  { id: 'b-2', isbn: '978-0262033848', title: 'Introduction to Algorithms (4th Ed)', author: 'Cormen, Leiserson, Rivest', category: 'Algorithms', totalCopies: 20, availableCopies: 12 },
  { id: 'b-3', isbn: '978-0134685991', title: 'Effective Java (3rd Ed)', author: 'Joshua Bloch', category: 'Software Engineering', totalCopies: 10, availableCopies: 4 }
];

export const LibraryWorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<BookItem[]>(initialBooks);
  const [search, setSearch] = useState('');

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.isbn.includes(search)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
            Central Library Administration
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Catalog search, book circulation, borrowing/returns ledger, e-journals, and overdue fines
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <StatCard title="Total Books Cataloged" value="45,200+" icon={BookOpen} subtitle="Hardcover &amp; Digital Volumes" />
        <StatCard title="Active Issued Books" value="1,240" icon={Clock} subtitle="Currently Borrowed" />
        <StatCard title="E-Journals Accessible" value="12,000+" icon={FileText} subtitle="IEEE, ACM &amp; Elsevier" />
        <StatCard title="Overdue Returns" value="18" icon={CheckCircle2} subtitle="Pending Return Notice" />
      </div>

      {/* Book Search & Catalog */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
            Central Library Catalog Search
          </h3>
          <input
            type="text"
            className="form-input"
            style={{ width: '260px' }}
            placeholder="Search title, author, ISBN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ISBN</th>
                <th>Book Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Total Copies</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map(b => (
                <tr key={b.id}>
                  <td><strong>{b.isbn}</strong></td>
                  <td>{b.title}</td>
                  <td>{b.author}</td>
                  <td><Badge variant="navy">{b.category}</Badge></td>
                  <td>{b.totalCopies}</td>
                  <td><Badge variant={b.availableCopies > 0 ? 'active' : 'danger'}>{b.availableCopies} Copies Available</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
