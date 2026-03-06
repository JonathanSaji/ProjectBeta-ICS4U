try {
    // Create a new button element
    const button = document.createElement("button");

    // Add text to the button
    button.textContent = "Click Me";

    // Add CSS class for styling
    button.className = "my-button";

    // Add click event listener
    button.addEventListener("click", () => {
        alert("Button clicked!");
    });

    // Append the button to the container
    document.getElementById("button-container").appendChild(button);
} catch (error) {
    console.error("Error creating button:", error);
}

//Linking the monthly spending variable to the HTML element
let monthlySpending = 450.75; //Variable for monthly spending, can be updated with actual data
const spendingDisplay = document.getElementById("monthlySpending");
spendingDisplay.textContent = `$${monthlySpending}`;
