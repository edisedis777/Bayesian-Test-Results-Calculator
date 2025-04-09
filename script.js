// Get DOM elements
const prevalenceSlider = document.getElementById("prevalence");
const sensitivitySlider = document.getElementById("sensitivity");
const falsePositiveSlider = document.getElementById("falsePositive");

const prevalenceValue = document.getElementById("prevalence-value");
const sensitivityValue = document.getElementById("sensitivity-value");
const falsePositiveValue = document.getElementById("falsePositive-value");

const posteriorDisplay = document.getElementById("posterior");
const interpretationText = document.getElementById("interpretation-text");

const priorVisual = document.getElementById("prior-positive");
const posteriorVisual = document.getElementById("posterior-positive");

// Dark mode elements
const darkModeToggle = document.getElementById("dark-mode-toggle");

// --- Core Calculation ---

// Function to calculate posterior probability using Bayes' theorem
function calculateBayesianProbability(prevalence, sensitivity, falsePositive) {
  // P(Condition | Positive) = (Prevalence * Sensitivity) / P(Positive)
  // P(Positive) = (Prevalence * Sensitivity) + ((1 - Prevalence) * FalsePositiveRate)
  const numerator = prevalence * sensitivity;
  const denominator = numerator + (1 - prevalence) * falsePositive;

  // Avoid division by zero if denominator is somehow 0
  if (denominator === 0) {
    return 0;
  }
  return numerator / denominator;
}

// --- Display Updates ---

// Function to generate interpretation text
function generateInterpretation(prevalence, posterior) {
  const priorPercentage = (prevalence * 100).toFixed(1);
  const posteriorPercentage = (posterior * 100).toFixed(1);
  // Avoid division by zero or meaningless multiplier if prevalence is very low
  const multiplier =
    prevalence > 0.0001 ? (posterior / prevalence).toFixed(1) : "many";

  let interpretation = "";

  if (posterior < 0.001) {
    // Handle near-zero posterior
    interpretation = `With these parameters, a positive test result still means the condition is extremely unlikely (${posteriorPercentage}% chance). The prior probability was ${priorPercentage}%.`;
  } else if (posterior < 0.5) {
    interpretation = `With these parameters, even after a positive test, there's only a ${posteriorPercentage}% chance the condition is actually present. This has increased from the prior probability of ${priorPercentage}% (a ${multiplier}x increase), but it's still more likely to be a false positive.`;
  } else if (posterior < 0.9) {
    interpretation = `With these parameters, a positive test indicates a ${posteriorPercentage}% chance the condition is present, up from the prior probability of ${priorPercentage}% (a ${multiplier}x increase). This is significant, but further confirmation might be needed.`;
  } else {
    interpretation = `With these parameters, a positive test strongly indicates the condition is present with a ${posteriorPercentage}% probability, up from the prior probability of ${priorPercentage}% (a ${multiplier}x increase). This is a highly reliable result.`;
  }

  return interpretation;
}

// Function to update all displays
function updateDisplays() {
  // Get current values
  const prevalence = parseFloat(prevalenceSlider.value);
  const sensitivity = parseFloat(sensitivitySlider.value);
  const falsePositive = parseFloat(falsePositiveSlider.value);

  // Update value displays next to sliders
  prevalenceValue.textContent = `${(prevalence * 100).toFixed(1)}%`;
  sensitivityValue.textContent = `${(sensitivity * 100).toFixed(0)}%`;
  falsePositiveValue.textContent = `${(falsePositive * 100).toFixed(0)}%`;

  // Calculate posterior probability
  const posterior = calculateBayesianProbability(
    prevalence,
    sensitivity,
    falsePositive
  );

  // Update main probability result display
  posteriorDisplay.textContent = `${(posterior * 100).toFixed(1)}%`;

  // Update visualization bars
  priorVisual.style.width = `${prevalence * 100}%`;
  posteriorVisual.style.width = `${posterior * 100}%`;

  // Update result color based on probability strength
  const isDarkMode = document.body.classList.contains("dark-mode");
  if (posterior < 0.3) {
    posteriorDisplay.style.color = isDarkMode ? "#ff7675" : "#e74c3c"; // Lighter red / Red
  } else if (posterior < 0.7) {
    posteriorDisplay.style.color = isDarkMode ? "#fab1a0" : "#f39c12"; // Lighter orange / Orange
  } else {
    posteriorDisplay.style.color = isDarkMode ? "#55efc4" : "#27ae60"; // Lighter green / Green
  }

  // Update interpretation text
  interpretationText.textContent = generateInterpretation(
    prevalence,
    posterior
  );

  // Update aria-valuenow for accessibility on sliders
  prevalenceSlider.setAttribute("aria-valuenow", prevalence);
  sensitivitySlider.setAttribute("aria-valuenow", sensitivity);
  falsePositiveSlider.setAttribute("aria-valuenow", falsePositive);
}

// --- Event Listeners ---

// Sliders
prevalenceSlider.addEventListener("input", updateDisplays);
sensitivitySlider.addEventListener("input", updateDisplays);
falsePositiveSlider.addEventListener("input", updateDisplays);

// Dark Mode Toggle
darkModeToggle.addEventListener("change", () => {
  if (darkModeToggle.checked) {
    document.body.classList.add("dark-mode");
    localStorage.setItem("darkMode", "enabled");
  } else {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("darkMode", "disabled");
  }
  updateDisplays(); // Re-run display update to potentially adjust colors
});

// --- Accessibility Enhancements ---
function enhanceAccessibility() {
  const sliders = [prevalenceSlider, sensitivitySlider, falsePositiveSlider];

  sliders.forEach((slider) => {
    // Initial ARIA setup
    slider.setAttribute("role", "slider");
    slider.setAttribute("aria-valuemin", slider.min);
    slider.setAttribute("aria-valuemax", slider.max);
    // aria-valuenow is set dynamically in updateDisplays

    // Keyboard navigation
    slider.addEventListener("keydown", function (e) {
      let newValue = parseFloat(this.value);
      // Step needs to be dynamic based on the slider
      const step =
        parseFloat(this.step) || (this.id === "prevalence" ? 0.001 : 0.01);
      let valueChanged = false;

      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        newValue += step;
        valueChanged = true;
        e.preventDefault(); // Prevent page scroll
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        newValue -= step;
        valueChanged = true;
        e.preventDefault(); // Prevent page scroll
      } else if (e.key === "PageUp") {
        newValue += step * 10; // Larger step
        valueChanged = true;
        e.preventDefault();
      } else if (e.key === "PageDown") {
        newValue -= step * 10; // Larger step
        valueChanged = true;
        e.preventDefault();
      } else if (e.key === "Home") {
        newValue = parseFloat(this.min);
        valueChanged = true;
        e.preventDefault();
      } else if (e.key === "End") {
        newValue = parseFloat(this.max);
        valueChanged = true;
        e.preventDefault();
      }

      if (valueChanged) {
        // Constrain to min/max and round to avoid floating point issues with step
        const precision = step.toString().split(".")[1]?.length || 0;
        newValue = parseFloat(
          Math.min(
            parseFloat(this.max),
            Math.max(parseFloat(this.min), newValue)
          ).toFixed(precision)
        );

        if (newValue !== parseFloat(this.value)) {
          this.value = newValue;
          updateDisplays(); // Update UI and aria-valuenow
        }
      }
    });
  });
}

// --- Initialization ---
function initialize() {
  // Check for saved dark mode preference
  const savedDarkMode = localStorage.getItem("darkMode");
  if (savedDarkMode === "enabled") {
    darkModeToggle.checked = true;
    document.body.classList.add("dark-mode");
  } else {
    darkModeToggle.checked = false;
    document.body.classList.remove("dark-mode");
  }

  // Initial calculation and display update
  updateDisplays();

  // Setup accessibility features
  enhanceAccessibility();
}

// Run initialization when the DOM is ready
document.addEventListener("DOMContentLoaded", initialize);
