import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { SideAdComponent } from '../../shared/components/side-ad.component';
import { LangSelectorComponent } from '../../shared/components/lang-selector.component';

const REMEMBER_KEY = 'ast_remember_email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SideAdComponent, TranslateModule, LangSelectorComponent],
  template: `
    <div class="page">
      <div class="bg">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="blob b3"></div>
        <div class="grid"></div>
      </div>

      <div class="back-row">
        <a class="back-btn" routerLink="/">{{ 'auth.back' | translate }}</a>
        <app-lang-selector variant="nav" />
      </div>

      <div class="auth-inner">
        <div class="auth-side-col"><app-side-ad /></div>
        <div class="card">
        <div class="card-head">
          <h2 class="card-title">{{ 'auth.login_title' | translate }}</h2>
          <p class="card-sub">{{ 'auth.login_sub' | translate }}</p>
        </div>

        <form class="card-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label>{{ 'auth.email' | translate }}</label>
            <input type="email" formControlName="email"
                   [placeholder]="'auth.email_placeholder' | translate" autocomplete="email" />
            <span class="err" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
              {{ 'auth.email_invalid' | translate }}
            </span>
          </div>

          <div class="field">
            <label>{{ 'auth.password' | translate }}</label>
            <input type="password" formControlName="password"
                   [placeholder]="'auth.password_placeholder' | translate" autocomplete="current-password" />
            <span class="err" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
              {{ 'auth.password_min' | translate }}
            </span>
          </div>

          <div class="remember-row">
            <label class="remember-label">
              <input type="checkbox" formControlName="remember" />
              <span>{{ 'auth.remember_me' | translate }}</span>
            </label>
          </div>

          <div class="err global" *ngIf="errorMsg">{{ errorMsg }}</div>

          <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
            {{ loading ? ('auth.login_loading' | translate) : ('auth.login_submit' | translate) }}
          </button>
        </form>

        <div class="card-links">
          <p class="link-row">{{ 'auth.login_no_account' | translate }} <a routerLink="/auth/register">{{ 'auth.login_register_link' | translate }}</a></p>
          <p class="link-row"><a routerLink="/auth/forgot-password">{{ 'auth.login_forgot' | translate }}</a></p>
          <p class="link-row"><a routerLink="/lobby">{{ 'auth.login_guest' | translate }}</a></p>
        </div>
        </div>
        <div class="auth-side-col"><app-side-ad /></div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page {
      position: relative;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .bg { position: absolute; inset: 0; background: var(--t-bg); }
    .blob { position: absolute; border-radius: 50%; filter: blur(90px); will-change: transform; }
    .b1 {
      width: 55vw; height: 55vw; max-width: 700px; max-height: 700px;
      background: var(--t-b1);
      opacity: var(--t-b1-op); top: -15%; left: -10%;
      animation: drift 20s ease-in-out infinite alternate;
    }
    .b2 {
      width: 50vw; height: 50vw; max-width: 650px; max-height: 650px;
      background: var(--t-b2);
      opacity: var(--t-b2-op); bottom: -15%; right: -10%;
      animation: drift 26s ease-in-out infinite alternate-reverse;
    }
    .b3 {
      width: 40vw; height: 40vw; max-width: 500px; max-height: 500px;
      background: var(--t-b3);
      opacity: var(--t-b3-op); top: 30%; left: 35%;
      animation: drift 17s ease-in-out infinite alternate;
    }
    .grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(var(--t-grid) 1px, transparent 1px),
        linear-gradient(90deg, var(--t-grid) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    @keyframes drift {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(40px, 40px) scale(1.08); }
    }

    .back-row {
      position: absolute;
      top: 20px; left: 28px; right: 28px;
      z-index: 20;
      display: flex; align-items: center; justify-content: space-between;
    }
    .back-btn {
      z-index: 20;
      color: var(--t-back);
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      letter-spacing: .02em;
      transition: color .15s;
    }
    .back-btn:hover { color: var(--t-back-h); }

    .auth-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      position: relative;
      z-index: 1;
    }
    /* Columnas laterales: ocultas en móvil, centran el ad en el espacio entre el card y el borde */
    .auth-side-col {
      display: none;
      flex: 1;
      align-items: center;
      justify-content: center;
    }
    @media (min-width: 1420px) {
      .auth-side-col { display: flex; }
    }

    .card {
      position: relative;
      z-index: 10;
      background: var(--t-surface2);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--t-bd);
      border-radius: 24px;
      padding: clamp(28px, 5vw, 48px);
      width: min(420px, 90vw);
      color: var(--t-tx);
      box-shadow: var(--t-card-shadow);
    }

    .card-title {
      font-size: clamp(22px, 3vw, 30px);
      font-weight: 800;
      margin: 0 0 6px;
      background: var(--t-logo-grad);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .card-head { margin-bottom: 24px; }

    .card-sub {
      font-size: 14px;
      color: var(--t-tx4);
      margin: 0;
    }

    .field { margin-bottom: 18px; }
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--t-tx3);
      letter-spacing: .06em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    input[type="email"],
    input[type="password"] {
      width: 100%;
      padding: 12px 16px;
      background: var(--t-input-bg);
      border: 1px solid var(--t-bd2);
      border-radius: 10px;
      color: var(--t-tx);
      font-size: 15px;
      font-family: inherit;
      box-sizing: border-box;
      transition: border-color .15s, background .15s;
    }
    input[type="email"]::placeholder,
    input[type="password"]::placeholder { color: var(--t-placeholder); }
    input[type="email"]:focus,
    input[type="password"]:focus {
      outline: none;
      border-color: var(--t-focus-bd);
      background: var(--t-focus-bg);
    }

    .remember-row {
      margin-bottom: 16px;
    }
    .remember-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 13px;
      color: var(--t-tx4);
      letter-spacing: 0;
      text-transform: none;
      font-weight: 500;
    }
    .remember-label input[type="checkbox"] {
      width: 15px; height: 15px;
      accent-color: var(--t-accent);
      cursor: pointer;
    }

    .err { color: var(--t-err); font-size: 12px; margin-top: 5px; display: block; }
    .err.global { margin-bottom: 14px; text-align: center; }

    .btn-submit {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, var(--t-accent-dk), var(--t-accent));
      border: none;
      border-radius: 12px;
      color: var(--t-on-accent);
      font-size: 16px;
      font-weight: 800;
      cursor: pointer;
      font-family: inherit;
      letter-spacing: .04em;
      box-shadow: 0 0 30px var(--t-accent-glow);
      transition: transform .15s, box-shadow .15s;
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 0 50px var(--t-accent-glow2);
    }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }

    .link-row {
      text-align: center;
      color: var(--t-tx5);
      font-size: 13px;
      margin: 16px 0 0;
    }
    .link-row a { color: var(--t-accent); text-decoration: none; font-weight: 600; }
    .link-row a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .page {
        height: auto; min-height: 100vh;
        overflow-y: auto;
        align-items: flex-start;
        padding: 64px 0 40px;
      }
      .back-btn { top: 16px; left: 16px; font-size: 13px; }
      .card { margin: auto; }
    }

    /* Móvil landscape: 2 columnas, sin scroll */
    @media (max-height: 450px) and (orientation: landscape) {
      .page { height: 100vh; overflow: hidden; padding: 0; align-items: center; }
      .back-btn { top: 8px; left: 12px; font-size: 11px; }

      .card {
        display: grid;
        grid-template-columns: 170px 1fr;
        grid-template-rows: auto 1fr;
        grid-template-areas: "hd fc" "lk fc";
        gap: 0 20px;
        width: min(680px, 92vw);
        padding: 14px 20px;
        border-radius: 16px;
        align-items: start;
      }
      .card-head  { grid-area: hd; margin-bottom: 0; border-right: 1px solid var(--t-bd); padding-right: 16px; }
      .card-form  { grid-area: fc; }
      .card-links { grid-area: lk; align-self: end; border-right: 1px solid var(--t-bd); padding-right: 16px; }

      .card-title { font-size: 17px; margin-bottom: 4px; }
      .card-sub   { font-size: 12px; margin-bottom: 0; }

      .field { margin-bottom: 8px; }
      label  { font-size: 10px; margin-bottom: 3px; }
      input[type="email"],
      input[type="password"] { padding: 7px 10px; font-size: 13px; border-radius: 8px; }
      .btn-submit { padding: 9px; font-size: 13px; margin-top: 2px; }

      .link-row { margin-top: 7px; font-size: 11px; }
    }
  `]
})
export class LoginComponent implements OnInit {
  form;
  loading = false;
  errorMsg = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly translate: TranslateService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [false],
    });
  }

  ngOnInit(): void {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      this.form.patchValue({ email: saved, remember: true });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    const { email, password, remember } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => {
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, email!);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
        void this.router.navigate(['/lobby']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message ?? this.translate.instant('auth.login_error');
      },
    });
  }
}
