# setup-kubectl

This action sets up a `kubectl` exectubale for use in a GitHub Actions workflow.

## Usage

See [action.yml](action.yml).

### Basic example

```yaml
on: push

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: ThomasKliszowski/setup-kubectl@v1
        with:
          kube-config: YXBpVmVyc2lvbjogdjEKY2x1c3RlcnM6Ci0gY2x1c3RlcjoKICAgIGNlcnRpZmljYXRlLWF1dGhvcml0eS1kYXRhOiBZMlZ5ZEdsbWFXTmhkR1V0WVhWMGFHOXlhWFI1TFdSaGRHRT0KICAgIHNlcnZlcjogaHR0cHM6Ly9zZXJ2ZXIuZ29vZ2xlLmNvbQogIG5hbWU6IG15LWNsdXN0ZXIKY29udGV4dHM6Ci0gY29udGV4dDoKICAgIGNsdXN0ZXI6IG15LWNsdXN0ZXIKICAgIG5hbWVzcGFjZTogZGVmYXVsdAogICAgdXNlcjogbXktdXNlcgogIG5hbWU6IG15LWNvbnRleHQKY3VycmVudC1jb250ZXh0OiBteS1jb250ZXh0CmtpbmQ6IENvbmZpZwpwcmVmZXJlbmNlczoge30KdXNlcnM6Ci0gbmFtZTogbXktdXNlcgogIHVzZXI6CiAgICB0b2tlbjogdXNlci10b2tlbgo=
          kube-version: 1.15.0
      - run: kubectl set image deployment/my-app app=my-app-image
```

## License

The scripts and documentation in this project are released under the [MIT license](LICENSE.md).
