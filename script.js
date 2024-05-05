
    const form = document.getElementById('form');
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const mobile = document.getElementById('mobile');

    form.addEventListener('submit', e => {
        e.preventDefault();
        validateInputs();
    });

    const setError = (element, message) => {
        const inputControl = element.parentElement;
        const errorDisplay = inputControl.querySelector('.error');

        errorDisplay.innerText = message;
        inputControl.classList.add('error');
        inputControl.classList.remove('success');
    };

    const setSuccess = element => {
        const inputControl = element.parentElement;
        const errorDisplay = inputControl.querySelector('.error');

        errorDisplay.innerText = '';
        inputControl.classList.add('success');
        inputControl.classList.remove('error');
    };

    const isValidEmail = email => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    const validateInputs = () => {
        const nameValue = name.value.trim();
        const emailValue = email.value.trim();
        const passwordValue = password.value.trim();
        const mobileValue = mobile.value.trim();

        if (nameValue === '') {
            setError(name, 'Username is required');
        } else {
            setSuccess(name);
        }

        // ... (similar adjustments for other fields)

    };
</script>