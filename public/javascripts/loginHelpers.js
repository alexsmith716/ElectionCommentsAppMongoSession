
var helper = {

    init: function() {

        window.showLoading = function() {
            $('.modal-backdrop').show();
        };
        window.hideLoading = function() {
            $('.modal-backdrop').hide();
        };

        showLoading(); 

        $('[name="forgotEmail"]').prop('required', true);
        $('[name="email"]').prop('required', true);
        $('[name="password"]').prop('required', true);

        setTimeout(function() { hideLoading(); }, 500);

        helper.initializeJqueryEvents();
    },

    initializeJqueryEvents:  function(){

        var emailPattern = /^\S+@\S+\.\S+/;
        var passwordPattern = /^\S{4,}$/;

        $('#forgotPasswordAnchor').click(function(){
            $('#forgotPasswordFormModal').modal({
                keyboard: false,
                backdrop: 'static'
            })
        });

        $('#forgotPasswordFormModal').on('hidden.bs.modal', function () {
            $('#forgotEmail').val('');
            $('#forgotPasswordForm .loginerror').removeClass('show').html('');
            $('#forgotEmail').removeClass('has-error');
            $('.modalAlertWarning').hide();
            $('.modalOkayBtn').hide();
            $('.modalCancelSubmitBtns').show();
        });

        $('#forgotPasswordForm').on('submit', function(e) {

            e.preventDefault();

            $('#forgotEmail').removeClass('has-error');
            $('#forgotPasswordForm .loginerror').removeClass('show').html('');
            
            var email = $('#forgotEmail').val();
            email = email.trim();
            var isEmailValid = emailPattern.test(email);

            if (email === '') {
                $('#forgotEmail').addClass('has-error');
                $('#forgotPasswordForm .loginerror').addClass('show').html('Please enter email');
                return false;
            }
            if (!isEmailValid) {
                $('#forgotEmail').addClass('has-error');
                $('#forgotPasswordForm .loginerror').addClass('show').html('Please enter your valid email');
                return false;
            }

            $('.loading').show();

            var data = {};
            var pathName = 'email';
            data[pathName] = email;
            pathName = 'expectedResponse';
            data[pathName] = 'true';
            var serviceUrl = $(this).attr('action');
            
            $.ajax({
                rejectUnauthorized: false,
                url: serviceUrl,
                type: 'POST',
                data: JSON.stringify(data),
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                accepts: 'application/json',

                success: function(data, status, xhr) {

                    if (data.response === 'success') {
                        console.log('signUpSubmitBtn > ajax > SUCCESS > SUCCESS');

                        $('.modalAlertWarning').show();
                        $('.modalOkayBtn').show();
                        $('.modalCancelSubmitBtns').hide();
                        $('.loading').hide();
                    } else {
                        console.log('signUpSubmitBtn > ajax > SUCCESS > ERROR');

                        $('#forgotEmail').addClass('has-error');
                        $('#forgotPasswordForm .loginerror').addClass('show').html('Could not validate your email.');
                        $('.loading').hide();
                        return false;
                    }
                },
                error: function(xhr, status, error) {
                    var parsedXHR = JSON.parse(xhr.responseText);

                    console.log('#forgotPasswordForm > ajax > ERROR > ERROR > parsedXHR: ', parsedXHR);

                    if(parsedXHR.type === 'token'){
                        location.href = parsedXHR.redirect;
                    }else{
                        $('#forgotEmail').addClass('has-error');
                        $('#forgotPasswordForm .loginerror').addClass('show').html('Could not validate your email, try again or contact customer service.');
                        $('.loading').hide();
                        return false;
                    }

                }
            });
        });

        $('#forgotEmail').on('keypress', function(e) {
            var key = e.keyCode;
            if (key === 13) {
                $('#forgotPasswordForm').submit();
            }
        });

        $('#loginForm').on('submit', function(e) {

            e.preventDefault();
            showLoading();

            $('#loginForm .loginerror').removeClass('show');
            $('#loginForm .form-control').removeClass('has-error');

            var data = {};
            var email = $.trim($('#login-email').val());
            var password = $.trim($('#login-password').val());
            var serviceUrl = $(this).attr('action');
 
            if (email === '' || password === '') {

                hideLoading();
                return false;

            }else{

                data = {
                    email: email,
                    password: password
                };

                data['_csrf'] = $('meta[name="csrf-token"]').attr('content');

                $.ajax({

                    rejectUnauthorized: false,
                    url: serviceUrl,
                    type: 'POST',
                    data: JSON.stringify(data),
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    accepts: 'application/json',

                    success: function(data, status, xhr) {

                        if (data.response === 'success') {

                            location.href = data.redirect;

                        } else {

                            $('#loginForm .form-control').addClass('has-error');
                            $('#loginForm .loginerror').addClass('show');
                            $('#loginForm .loginerror').html('Email and Password don\'t match. Please try again.');

                            //helper.handleErrorResponse(data.validatedData);

                            hideLoading();
                            return false;
                        }
                    },

                    error: function(xhr, status, error) {

                        var parsedXHR = JSON.parse(xhr.responseText);

                        location.href = parsedXHR.redirect;

                        return false;

                    }
                });
            }
        });
    },

    showLoading: function() {
        $('.modal-backdrop').show();
    },

    hideLoading: function() {
        $('.modal-backdrop').hide();
    },

    clearForgotPassword: function() {
        $("#forgotPasswordForm").get(0).reset();
        $('#forgotEmail').val('');
        $('#forgotPasswordForm .loginerror').addClass('hide');
        $('#forgotPasswordForm .loginerror').text('');
        $('#forgotEmail').removeClass('invalid');
        $('.modalAlertWarning').hide();
        $('.modalOkayBtn').hide();
        $('.modalCancelSubmitBtns').show();
    },

    handleErrorResponse: function(data) {

        Object.keys(data).forEach(function(p) {

            /*
            $('#loginForm .form-control').addClass('has-error');
            $('#loginForm .loginerror').addClass('show');
            $('#loginForm .loginerror').html('Email and Password don\'t match. Please try again.');
            */
            
            /*
            switch (p) {

                case 'email':
                    helper.validateEmailField(null, 'email', 'confirmEmail', data[p]);
                    break;
   
                case 'password':
                    helper.testUserInput(p, helper.pattern.password, data[p]);
                    break;
            }
            */
        });
    },

}

$(function () {
    helper.init();
});

