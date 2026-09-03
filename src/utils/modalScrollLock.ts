import { useEffect } from 'react';

let openModalCount = 0;
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';
let originalHtmlOverflow = '';

const MODAL_SELECTORS = [
  '.modal-overlay',
  '.swarrnim-modal-overlay',
  '[role="dialog"]',
  '[aria-modal="true"]',
  '.fixed.inset-0[class*="z-50"]',
  '.fixed.inset-0[class*="z-40"]',
  '.fixed.inset-0[class*="z-[1050]"]',
  '.fixed.inset-0[class*="z-[1100]"]'
].join(', ');

/**
 * Globally locks body and html scrolling when one or more modals are active.
 */
export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;

  if (openModalCount === 0) {
    originalBodyOverflow = document.body.style.overflow || '';
    originalBodyPaddingRight = document.body.style.paddingRight || '';
    originalHtmlOverflow = document.documentElement.style.overflow || '';

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
  }

  openModalCount++;
}

/**
 * Unlocks body scrolling when all active modals have closed.
 */
export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;

  openModalCount = Math.max(0, openModalCount - 1);

  if (openModalCount === 0) {
    document.body.style.overflow = originalBodyOverflow;
    document.body.style.paddingRight = originalBodyPaddingRight;
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
  }
}

/**
 * React hook to automatically lock body scroll and attach Escape key listener.
 */
export function useModalScrollLock(isOpen: boolean, onClose?: () => void): void {
  useEffect(() => {
    if (!isOpen) return;

    lockBodyScroll();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
}

/**
 * Initializes automatic DOM observer and wheel event guard for all modals in the ERP.
 */
export function initGlobalModalObserver(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let isObserverActive = false;

  const checkDomModals = () => {
    try {
      const activeModals = document.querySelectorAll(MODAL_SELECTORS);
      const visibleModals = Array.from(activeModals).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });

      if (visibleModals.length > 0) {
        if (!document.body.classList.contains('modal-open')) {
          document.body.classList.add('modal-open');
          document.documentElement.classList.add('modal-open');
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
        }
      } else {
        if (openModalCount === 0 && document.body.classList.contains('modal-open')) {
          document.body.classList.remove('modal-open');
          document.documentElement.classList.remove('modal-open');
          document.body.style.overflow = originalBodyOverflow;
          document.documentElement.style.overflow = originalHtmlOverflow;
        }
      }
    } catch {
      // safe fallback
    }
  };

  // Wheel event barrier: prevents background scrolling when wheeling inside or over a modal
  window.addEventListener('wheel', (e: WheelEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const modalOverlay = target.closest(MODAL_SELECTORS);
    if (!modalOverlay) return;

    // Check if scrolling inside a scrollable container within the modal
    let scrollableParent: HTMLElement | null = null;
    let curr: HTMLElement | null = target;

    while (curr && curr !== modalOverlay) {
      const style = window.getComputedStyle(curr);
      const isScrollableY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && curr.scrollHeight > curr.clientHeight;
      if (isScrollableY) {
        scrollableParent = curr;
        break;
      }
      curr = curr.parentElement;
    }

    if (!scrollableParent) {
      // Target is on the backdrop or a non-scrollable header/footer
      e.preventDefault();
      return;
    }

    // Target is inside a scrollable body: prevent scroll propagation to window at boundaries
    const isAtTop = scrollableParent.scrollTop <= 0 && e.deltaY < 0;
    const isAtBottom = (scrollableParent.scrollTop + scrollableParent.clientHeight >= scrollableParent.scrollHeight - 1) && e.deltaY > 0;

    if (isAtTop || isAtBottom) {
      e.preventDefault();
    }
  }, { passive: false });

  // Escape key global listener for active modals
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const activeModals = document.querySelectorAll(MODAL_SELECTORS);
      if (activeModals.length > 0) {
        const topModal = activeModals[activeModals.length - 1];
        const closeBtn = topModal.querySelector<HTMLElement>('button[aria-label*="Close"], button[title*="Close"], .btn-close, .modal-close');
        if (closeBtn) {
          closeBtn.click();
        }
      }
    }
  });

  // MutationObserver to track dynamically added/removed modal overlays
  if ('MutationObserver' in window) {
    const observer = new MutationObserver(() => {
      checkDomModals();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden']
    });

    isObserverActive = true;
  }
}

// Auto-initialize on module import
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initGlobalModalObserver());
  } else {
    initGlobalModalObserver();
  }
}
