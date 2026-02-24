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
