from lightning import Lightning
from numpy import random, ceil, array

lgn = Lightning()

series = random.randn(10,500)

lgn.line(series)