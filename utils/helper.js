//for checking empty string or not
const isEmpty = (string) => {
    if (string.trim() === '') {
        return true;
    } else {
        return false;
    }
}
//for checking valid email address with regualr expression
const isEmail = (email) => {
    const regx = /^(([^<>()\[\]\\.,;:\s@”]+(\.[^<>()\[\]\\.,;:\s@”]+)*)|(“.+”))@((\[[0–9]{1,3}\.[0–9]{1,3}\.[0–9]{1,3}\.[0–9]{1,3}\])|(([a-zA-Z\-0–9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regx)) {
        return true
    } else {
        return false
    }
}
//for validating signup data
exports.validateSignUPData = (data) => {
    let errors = {};
    if (isEmpty(data.email)) {
        errors.email = 'Email Filed Is Required!'
    } else if (!isEmail(data.email)) {
        errors.email = 'Must be valid email address';
    }
    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Password Did not match';
    }
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}
//for validating signin data
exports.validateLoginData = (data) => {
    let errors = {}
    if (isEmpty(data.email)) {
        errors.email = 'Email filed is required!'
    } else if (isEmpty(data.password)) {
        errors.password = 'Password filed is required!'
    } else if (!isEmail(data.email)) {
        errors.email = 'Must be valid email address'
    }
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}