try {
  document.addEventListener("DOMContentLoaded", () => {

    const addModalOverlay = document.getElementById("addModalOverlay");

    // Helper functions to open/close
    function openModal() {
      addModalOverlay.classList.add("visible");
      addModalOverlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      addModalOverlay.classList.remove("visible");
      addModalOverlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    // Both "Add Subscription" buttons open the modal
    document.getElementById("addBtn").addEventListener("click", openModal);
    document.getElementById("openAddModalNav").addEventListener("click", openModal);

    // Close button inside modal
    document.getElementById("closeAddModal").addEventListener("click", closeModal);

    // Click outside the modal box to close
    addModalOverlay.addEventListener("click", (e) => {
      if (e.target === addModalOverlay) closeModal();
    });

    // Escape key closes modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    document.getElementById("chooseSubscription").addEventListener("click", () => {
      alert("User chose: Subscription");
      // TODO: show subscription form
    });

    document.getElementById("chooseTrial").addEventListener("click", () => {
      alert("User chose: Free Trial");
      // TODO: show trial form
    });
  });
} catch (error) {
  console.error("Error:", error);
}

//Linking the monthly spending variable to the HTML element
let monthlySpending = 450.75; //Variable for monthly spending, can be updated with actual data
const spendingDisplay = document.getElementById("monthlySpending");
spendingDisplay.textContent = `$${monthlySpending}`;
