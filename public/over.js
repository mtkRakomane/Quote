document.getElementById('install_difficulty').addEventListener('change', async function() {
    const selectedDifficulty = this.value;
    if (selectedDifficulty) {
      const response = await fetch(`/api/descriptions/${selectedDifficulty}`);
      const data = await response.json();
      document.getElementById('hoursValue').innerText = data.factor; 

      document.getElementById('selectedInstallDifficulty').value = selectedDifficulty; 
      document.getElementById('selectedFactor').value = data.factor;
    } else {
      document.getElementById('hoursValue').innerText = '';
      document.getElementById('selectedInstallDifficulty').value = '';
      document.getElementById('selectedFactor').value = '';
    }
  });
