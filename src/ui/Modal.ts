export interface ModalButton {
  label: string;
  style?: 'primary' | 'danger' | 'secondary';
  onClick: () => void | Promise<void>;
}

export interface ModalOptions {
  title: string;
  message: string;
  buttons: readonly ModalButton[];
}

/**
 * 범용 확인 모달. 오버레이 + 카드 + 버튼을 동적으로 만들어
 * body 에 붙이고 버튼 클릭 또는 오버레이 외부 클릭 시 닫힌다.
 */
export function showModal(options: ModalOptions): void {
  const overlay = document.createElement('div');
  overlay.className = 'pm-modal-overlay';

  const card = document.createElement('div');
  card.className = 'pm-modal-card';

  const title = document.createElement('h3');
  title.className = 'pm-modal-title';
  title.textContent = options.title;

  const message = document.createElement('p');
  message.className = 'pm-modal-message';
  message.textContent = options.message;

  const actions = document.createElement('div');
  actions.className = 'pm-modal-actions';

  const close = (): void => {
    overlay.remove();
  };

  for (const btn of options.buttons) {
    const el = document.createElement('button');
    el.className = `pm-modal-button pm-modal-button-${btn.style ?? 'secondary'}`;
    el.textContent = btn.label;
    el.addEventListener('click', async () => {
      close();
      await btn.onClick();
    });
    actions.appendChild(el);
  }

  card.append(title, message, actions);
  overlay.appendChild(card);

  // 오버레이(카드 바깥) 클릭으로 닫히지 않게 — 실수 방지.
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) e.preventDefault();
  });

  document.body.appendChild(overlay);
}
