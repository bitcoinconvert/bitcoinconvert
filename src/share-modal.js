document.addEventListener('DOMContentLoaded', () => {
  const shareModal = document.getElementById('shareModal');
  if (shareModal) {
    shareModal.addEventListener('click', () => {
      shareModal.classList.toggle('hidden');
    });
  }
});