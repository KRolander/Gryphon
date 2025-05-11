<script lang="js">
import RegisterService from '@/services/RegisterService';

export default {
    methods: {
        submitEmail() {
            // Get data from input field
            let inputEmail = this.$refs.emailField.value
            RegisterService.register({email: inputEmail})
            console.log(`The submitted email is: ${inputEmail}`);
        }
    }
}
</script>

<template>
    <div>
        <input type="text" ref="emailField">
        <button @click="submitEmail">Submit</button>
        <v-btn>Button</v-btn>
    </div>
</template>

<style lang="css" scoped></style>