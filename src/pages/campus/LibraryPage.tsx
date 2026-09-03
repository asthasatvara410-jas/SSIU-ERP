import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { BookOpen, Search, Download, CheckCircle, Clock } from 'lucide-react';

interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  department: string;
  copiesAvailable: number;
  totalCopies: number;
  format: 'HARDCOPY' | 'EBOOK_PDF';
  downloadUrl?: string;
}

const initialBooks: LibraryBook[] = [
  {
    id: 'bk-1',
    isbn: '978-0131103627',
    title: 'C Programming Language (2nd Edition)',
    author: 'Brian W. Kernighan, Dennis M. Ritchie',
    department: 'Computer Engineering',
    copiesAvailable: 14,
    totalCopies: 20,
    format: 'HARDCOPY'
  },
  {
    id: 'bk-2',
    isbn: '978-0262033848',
    title: 'Introduction to Algorithms (CLRS 3rd Ed)',
    author: 'Thomas H. Cormen, Charles E. Leiserson',
    department: 'Computer Engineering',
    copiesAvailable: 8,
    totalCopies: 15,
    format: 'EBOOK_PDF',
    downloadUrl: 'https://swarrnim.edu.in/docs/clrs-algorithms.pdf'
  },
  {
    id: 'bk-3',
    isbn: '978-0136086208',
    title: 'Operating System Concepts (Silberschatz)',
    author: 'Abraham Silberschatz, Peter B. Galvin',
    department: 'Computer Engineering',
    copiesAvailable: 5,
    totalCopies: 12,
    format: 'HARDCOPY'
  }
];

export const LibraryPage: React.FC = () => {
  const { role } = useAuth();
  const [books] = useState<LibraryBook[]>(initialBooks);
  const [search, setSearch] = useState('');

  const filtered = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.isbn.includes(search)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
          SSIU Central Library &amp; E-Resources Catalog
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Search university library book repository, check physical copy availability, and download digital e-books
        </p>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <input 
          type="text" 
          placeholder="Search by Title, Author, or ISBN..." 
          className="form-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>
          Library Book Repository ({filtered.length} Titles)
        </h3>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ISBN</th>
                <th>Book Title &amp; Author</th>
                <th>Department</th>
                <th>Available Copies</th>
                <th>Format</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(bk => (
                <tr key={bk.id}>
                  <td style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>{bk.isbn}</td>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{bk.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Author: {bk.author}</div>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{bk.department}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: bk.copiesAvailable > 0 ? '#10B981' : '#EF4444' }}>
                      {bk.copiesAvailable} / {bk.totalCopies} Available
                    </span>
                  </td>
                  <td>
                    <Badge variant={bk.format === 'EBOOK_PDF' ? 'orange' : 'navy'}>{bk.format}</Badge>
                  </td>
                  <td>
                    {bk.format === 'EBOOK_PDF' ? (
                      <button onClick={() => window.open(bk.downloadUrl || '#', '_blank')} className="btn btn-primary btn-sm">
                        <Download size={14} /> Download E-Book
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reserve at Library Desk</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
