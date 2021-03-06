import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Login } from 'src/app/common/Login';
import { SessionService } from 'src/app/services/session.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { Register } from '../../common/Register';
import { SendmailService } from '../../services/sendmail.service';
import { FavoritesService } from 'src/app/services/favorites.service';
import { Customer } from 'src/app/common/Customer';
import { CustomerService } from 'src/app/services/customer.service';

@Component({
  selector: 'app-sign-form',
  templateUrl: './sign-form.component.html',
  styleUrls: ['./sign-form.component.css']
})
export class SignFormComponent implements OnInit {

  login!: Login;
  register !: Register;
  show: boolean = false;
  loginForm: FormGroup;
  registerForm!: FormGroup;
  isLoggedIn = false;
  isLoginFailed = false;
  roles: string = '';
  otpcode!: any;

  constructor(private sendMailService: SendmailService, private favoriteService: FavoritesService, private sessionService: SessionService, private toastr: ToastrService,
    private router: Router, private authService: AuthService, private userService: CustomerService) {
    this.loginForm = new FormGroup({
      'email': new FormControl(null),
      'password': new FormControl(null)
    });

    this.registerForm = new FormGroup({
      'email': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, [Validators.required, Validators.minLength(6)]),
      'name': new FormControl(null, [Validators.required, Validators.minLength(6)]),
      'status': new FormControl(true),
      'gender': new FormControl(true),
      'image': new FormControl('https://res.cloudinary.com/veggie-shop/image/upload/v1633795994/users/mnoryxp056ohm0b4gcrj.png'),
      'address': new FormControl(null, [Validators.required]),
      'phone': new FormControl(null, [Validators.required, Validators.minLength(10), Validators.pattern('(0)[0-9]{9}')]),
      'registerDate': new FormControl(new Date()),
      'role': new FormControl(["USER"]),
      'otp': new FormControl(null, [Validators.required, Validators.minLength(6)])
    });
  }

  ngOnInit(): void {
    this.checkLogin();
  }

  sign_up() {
    if (this.registerForm.invalid) {
      this.toastr.error('H??y nh???p ?????y ????? th??ng tin!', 'H??? th???ng');
      return;
    }
    this.otpcode = localStorage.getItem("otp");

    if (this.registerForm.value.otp == this.otpcode && this.registerForm.value.otp != null) {
      this.register = this.registerForm.value;
      window.localStorage.removeItem("otp");

      this.authService.register(this.register).subscribe(data => {
        Swal.fire({
          icon: 'success',
          title: '????ng k?? th??nh c??ng!',
          showConfirmButton: false,
          timer: 1500
        })
        setTimeout(() => {
          window.location.href = ('/');
        },
          500);
      }, error => {
        this.toastr.error(error.message, 'H??? th???ng');
      });
    }
    else {
      this.toastr.error('M?? OTP kh??ng ch??nh x??c!', 'H??? th???ng');
    }

  }

  sign_in() {
    this.login = this.loginForm.value;

    this.authService.login(this.login).subscribe(
      data => {

        this.sessionService.saveToken(data.token);
        // this.tokenStorage.saveUser(data);

        this.isLoginFailed = false;
        this.isLoggedIn = true;

        let userTemp: Customer;
        this.userService.getByEmail(String(this.sessionService.getUser())).subscribe(data => {
          userTemp = data as Customer;
          if (userTemp.roles[0].name == 'ROLE_ADMIN') {

            Swal.fire({
              icon: 'error',
              title: '????ng nh???p th???t b???i!',
              showConfirmButton: false,
              timer: 1500
            })
            this.toastr.error('Sai Th??ng Tin ????ng Nh???p', 'H??? th???ng');

            this.isLoginFailed = true;
            this.sessionService.signOut();
            return;
          } else {
            Swal.fire({
              icon: 'success',
              title: '????ng nh???p th??nh c??ng!',
              showConfirmButton: false,
              timer: 1500
            })

            this.router.navigate(['/home']);

            setTimeout(() => {
              window.location.href = ('/');
            },
              500);
          }
        })
      },
      error => {
        this.toastr.error('Sai Th??ng Tin ????ng Nh???p', 'H??? th???ng');
        Swal.fire({
          icon: 'error',
          title: '????ng nh???p th???t b???i!',
          showConfirmButton: false,
          timer: 1500
        })
        this.isLoginFailed = true;
      }
    );
  }

  sendOtp() {

    this.sendMailService.sendMailOtp(this.registerForm.value.email).subscribe(data => {
      window.localStorage.removeItem("otp");
      window.localStorage.setItem("otp", JSON.stringify(data));

      this.toastr.success('Ch??ng t??i ???? g???i m?? OTP v??? email c???a b???n !', 'H??? th???ng');
    }, error => {
      if (error.status == 404) {
        this.toastr.error('Email n??y ???? t???n t???i tr??n h??? th???ng !', 'H??? th???ng');
      } else {
        this.toastr.warning('H??y nh???p ????ng email !', 'H??? th???ng');
      }
    });

  }

  checkLogin() {
    if (this.sessionService.getUser() != null) {
      this.router.navigate(['/home']);
      window.location.href = ('/');
    }
  }

  toggle() {
    this.show = !this.show;
  }
  sendError() {
    this.toastr.warning('H??y nh???p ????ng email !', 'H??? th???ng');
  }
}
